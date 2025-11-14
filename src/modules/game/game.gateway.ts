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
        // プレイヤーの接続状態を更新
        await this.playersService.updateConnectionStatus(
          playerInfo.playerId,
          false,
        );

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
}
