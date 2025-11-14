import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { RoomsService } from '../rooms/rooms.service';
import { PlayersService } from '../players/players.service';
import { ReconnectDto } from './dto/reconnect.dto';
import { GameTerminationReason } from './dto/game-termination-reason.dto';
import { JwtPayload } from '../../types/express';
import { WsAuthGuard, WsRoomAuthGuard } from '../../guards';
import { WsCurrentUser, WsCurrentRoom, WsCurrentPlayer } from '../../decorators';
import { Room } from '../rooms/entities/room.entity';
import { Player } from '../players/entities/player.entity';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/game',
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(GameGateway.name);

  // ソケットIDとプレイヤー情報のマッピング
  private socketToPlayer = new Map<string, { playerId: string; roomId: string }>();

  // 部屋ごとのタイマーを管理
  private roomTimers = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly roomsService: RoomsService,
    private readonly playersService: PlayersService,
  ) {}

  // 接続時のハンドラ（接続の確立のみ）
  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  // 切断時のハンドラ
  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    
    const playerInfo = this.socketToPlayer.get(client.id);
    if (playerInfo) {
      try {
        // プレイヤー情報を取得
        const player = await this.playersService.findOne(playerInfo.playerId);
        
        // プレイヤーの接続状態を更新
        await this.playersService.updateConnectionStatus(
          playerInfo.playerId,
          false,
        );

        // プレイヤー退出通知を送信
        if (player) {
          await this.sendPlayerLeft(
            playerInfo.roomId,
            playerInfo.playerId,
            player.playerName,
          );
        }

        // ルームから退出
        client.leave(`room:${playerInfo.roomId}`);
        
        this.socketToPlayer.delete(client.id);

        this.logger.log(
          `Player ${playerInfo.playerId} disconnected from room ${playerInfo.roomId}`,
        );
      } catch (error) {
        this.logger.error(`Error during disconnect: ${error.message}`);
      }
    }
  }

  // player:reconnect イベント
  @UseGuards(WsAuthGuard, WsRoomAuthGuard)
  @SubscribeMessage('player:reconnect')
  async handleReconnect(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: ReconnectDto,
    @WsCurrentUser() user: JwtPayload,
    @WsCurrentRoom() room: Room,
    @WsCurrentPlayer() player: Player,
  ) {
    try {
      const { playerId, roomId } = user;

      this.logger.log(`Player ${playerId} attempting to reconnect to room ${roomId}`);

      // ソケットをRoomに参加させる
      await client.join(`room:${roomId}`);
      
      // ソケット情報を保存
      this.socketToPlayer.set(client.id, { playerId, roomId });

      // プレイヤーの接続状態を更新
      await this.playersService.updateConnectionStatus(playerId, true);

      this.logger.log(`Player ${playerId} reconnected to room ${roomId}`);

      // 最新のゲーム状態を取得してプッシュ
      await this.sendGameStatus(roomId);

      // 再接続成功を返す
      return {
        success: true,
        message: '再接続に成功しました',
      };
    } catch (error) {
      this.logger.error(`Reconnect failed: ${error.message}`);
      
      // エラーレスポンスを返す
      return {
        success: false,
        message: error.message || '再接続に失敗しました',
      };
    }
  }

  // game:statusUpdated イベントを送信するヘルパーメソッド
  async sendGameStatus(roomId: string) {
    try {
      const room = await this.roomsService.findById(roomId);
      if (!room) {
        this.logger.error(`Room ${roomId} not found`);
        return;
      }

      const players = await this.playersService.findByRoomId(roomId);

      const statusPayload = {
        room: {
          id: room.id,
          status: room.status,
          durationSeconds: room.durationSeconds,
          gracePeriodSeconds: room.gracePeriodSeconds,
          startedAt: room.startedAt ? room.startedAt.toISOString() : null,
        },
        players: players.map((p) => ({
          id: p.id,
          name: p.playerName,
          role: p.role,
          isCaptured: p.isCaptured,
        })),
      };

      // 特定のルームにブロードキャスト
      this.server.to(`room:${roomId}`).emit('game:statusUpdated', statusPayload);

      this.logger.log(`Sent game status to room ${roomId}`);
    } catch (error) {
      this.logger.error(`Failed to send game status: ${error.message}`);
    }
  }

  /**
   * ゲームタイマーを開始
   */
  async startGameTimer(roomId: string) {
    this.logger.log(`[startGameTimer] Starting timer for room ${roomId}`);
    
    // 既存のタイマーをクリア
    this.stopGameTimer(roomId);
    
    const room = await this.roomsService.findById(roomId);
    if (!room || !room.startedAt) {
      this.logger.error(`[startGameTimer] Invalid room or not started`);
      return;
    }
    
    const startTime = room.startedAt.getTime();
    const gameDuration = room.durationSeconds;
    const gracePeriod = room.gracePeriodSeconds;
    const totalSeconds = gameDuration + gracePeriod;
    
    // 1秒ごとに実行
    const timer = setInterval(async () => {
      try {
        const now = Date.now();
        const elapsedMs = now - startTime;
        const elapsedSeconds = Math.floor(elapsedMs / 1000);
        
        // 全体の時間を超えたか判定
        if (elapsedSeconds >= totalSeconds) {
          // 時間切れ
          await this.handleTimeUp(roomId);
          return;
        }
        
        // タイマーイベントを送信
        await this.sendTimerTick(roomId, elapsedSeconds, gameDuration, gracePeriod);
      } catch (error) {
        this.logger.error(`[Timer] Error in room ${roomId}: ${error.message}`);
      }
    }, 1000);
    
    this.roomTimers.set(roomId, timer);
    this.logger.log(`[startGameTimer] Timer started for room ${roomId}`);
  }

  /**
   * タイマーを停止
   */
  stopGameTimer(roomId: string) {
    const timer = this.roomTimers.get(roomId);
    if (timer) {
      clearInterval(timer);
      this.roomTimers.delete(roomId);
      this.logger.log(`[stopGameTimer] Timer stopped for room ${roomId}`);
    }
  }

  /**
   * game:timerTick イベントを送信
   * 猶予時間: ゲーム開始前に泥棒が逃げる時間
   * ゲーム時間: 警察が泥棒を捕まえる時間
   */
  private async sendTimerTick(
    roomId: string,
    elapsedSeconds: number,
    gameDuration: number,
    gracePeriod: number,
  ) {
    const totalSeconds = gameDuration + gracePeriod;
    const remainingSeconds = totalSeconds - elapsedSeconds;
    
    // 猶予時間中かどうか（ゲーム開始前）
    const isGracePeriod = elapsedSeconds < gracePeriod;
    
    const payload: any = {
      remainingSeconds,
      elapsedSeconds,
      totalSeconds,
      isGracePeriod,
    };
    
    // 猶予時間中の場合、猶予時間の残りを追加
    if (isGracePeriod) {
      payload.gracePeriodRemaining = gracePeriod - elapsedSeconds;
    }
    
    this.server.to(`room:${roomId}`).emit('game:timerTick', payload);
  }

  /**
   * 時間切れ処理
   */
  private async handleTimeUp(roomId: string) {
    this.logger.log(`[handleTimeUp] Time up for room ${roomId}`);
    
    // タイマーを停止
    this.stopGameTimer(roomId);
    
    // ゲームを終了
    await this.roomsService.terminateGame(roomId);
    
    // ゲーム終了通知を送信
    await this.sendGameTerminated(roomId, GameTerminationReason.TIME_UP);
    
    // 状態を更新
    await this.sendGameStatus(roomId);
  }

  /**
   * プレイヤー捕獲通知を送信
   */
  async sendPlayerCaptured(roomId: string, playerId: string) {
    this.logger.log(`[sendPlayerCaptured] Sending capture notification for player ${playerId} in room ${roomId}`);
    
    const player = await this.playersService.findOne(playerId);
    if (!player) {
      this.logger.warn(`[sendPlayerCaptured] Player ${playerId} not found`);
      return;
    }
    
    this.server.to(`room:${roomId}`).emit('player:capturedNotification', {
      playerId: player.id,
      playerName: player.playerName,
      message: `${player.playerName}が捕まりました`,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * プレイヤー解放通知を送信
   */
  async sendPlayerReleased(roomId: string, playerId: string) {
    this.logger.log(`[sendPlayerReleased] Sending release notification for player ${playerId} in room ${roomId}`);
    
    const player = await this.playersService.findOne(playerId);
    if (!player) {
      this.logger.warn(`[sendPlayerReleased] Player ${playerId} not found`);
      return;
    }
    
    this.server.to(`room:${roomId}`).emit('player:releasedNotification', {
      playerId: player.id,
      playerName: player.playerName,
      message: `${player.playerName}が解放されました`,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * ゲーム終了通知を送信
   */
  async sendGameTerminated(roomId: string, reason: GameTerminationReason) {
    this.logger.log(`[sendGameTerminated] Sending termination notification for room ${roomId}, reason: ${reason}`);
    
    const reasonMessages: Record<GameTerminationReason, string> = {
      [GameTerminationReason.TIME_UP]: '時間切れ',
      [GameTerminationReason.ALL_CAPTURED]: '全員捕獲',
      [GameTerminationReason.TERMINATED_BY_HOST]: 'ホストによる強制終了',
    };
    
    this.server.to(`room:${roomId}`).emit('game:terminatedNotification', {
      reason,
      message: `ゲームが終了しました: ${reasonMessages[reason]}`,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * プレイヤー退出通知を送信
   */
  async sendPlayerLeft(roomId: string, playerId: string, playerName: string) {
    this.logger.log(`[sendPlayerLeft] Sending left notification for player ${playerId} in room ${roomId}`);
    
    this.server.to(`room:${roomId}`).emit('player:leftNotification', {
      playerId,
      playerName,
      message: `${playerName}が退出しました`,
      timestamp: new Date().toISOString(),
    });
  }
}
