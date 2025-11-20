import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { PlayersService } from '../players/players.service';
import { GameGateway } from '../game/game.gateway';
import { GameTerminationReason } from '../game/dto/game-termination-reason.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { RoomActionDto } from './dto/room-action.dto';
import { RoomAuthGuard, HostGuard } from '../../guards';
import { CurrentUser, CurrentRoom } from '../../decorators';
import { JwtPayload } from '../../types/express';
import { Room } from './entities/room.entity';

@Controller('rooms')
export class RoomsController {
  constructor(
    private readonly roomsService: RoomsService,
    private readonly playersService: PlayersService,
    private readonly gameGateway: GameGateway,
  ) {}

  @Get()
  findAll() {
    return this.roomsService.findAll();
  }

  // 2.1 GET /rooms/status - 部屋の全状態を取得
  @Get('status')
  @UseGuards(RoomAuthGuard)
  async getRoomStatus(
    @CurrentUser() user: JwtPayload,
    @CurrentRoom() room: Room,
  ) {
    // 部屋に所属するプレイヤー一覧を取得
    const players = await this.playersService.findByRoomId(user.roomId);

    return {
      room: {
        id: room.id,
        status: room.status,
        durationSeconds: room.durationSeconds,
        gracePeriodSeconds: room.gracePeriodSeconds,
        maxPlayers: room.maxPlayers,
        startedAt: room.startedAt,
        hostPlayerId: room.hostPlayerId,
      },
      players: players.map((player) => ({
        id: player.id,
        playerName: player.playerName,
        role: player.role,
        isCaptured: player.isCaptured,
        isConnected: player.isConnected,
      })),
      currentPlayer: {
        playerId: user.playerId,
        roomId: user.roomId,
        isHost: user.isHost,
      },
    };
  }

  // 2.2 PATCH /rooms/settings - ゲーム設定を更新（ホスト専用）
  @Patch('settings')
  @UseGuards(RoomAuthGuard, HostGuard)
  @HttpCode(HttpStatus.OK)
  async updateSettings(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateSettingsDto,
  ) {
    const updateData: UpdateRoomDto = {};
    if (dto.durationSeconds !== undefined) {
      updateData.durationSeconds = dto.durationSeconds;
    }
    if (dto.gracePeriodSeconds !== undefined) {
      updateData.gracePeriodSeconds = dto.gracePeriodSeconds;
    }
    if (dto.maxPlayers !== undefined) {
      updateData.maxPlayers = dto.maxPlayers;
    }

    const updatedRoom = await this.roomsService.update(user.roomId, updateData);

    // WebSocketで状態を通知
    await this.gameGateway.sendGameStatus(user.roomId);

    return {
      message: '設定を更新しました',
      room: {
        id: updatedRoom.id,
        durationSeconds: updatedRoom.durationSeconds,
        gracePeriodSeconds: updatedRoom.gracePeriodSeconds,
        maxPlayers: updatedRoom.maxPlayers,
      },
    };
  }

  // 2.3 POST /rooms/start - ゲームを開始（ホスト専用）
  @Post('start')
  @UseGuards(RoomAuthGuard, HostGuard)
  @HttpCode(HttpStatus.OK)
  async startGame(
    @CurrentUser() user: JwtPayload,
  ) {
    const room = await this.roomsService.startGame(user.roomId);

    // WebSocketで状態を通知
    await this.gameGateway.sendGameStatus(user.roomId);

    // タイマーを開始
    await this.gameGateway.startGameTimer(user.roomId);

    return {
      message: 'ゲームを開始しました',
      room: {
        id: room.id,
        status: room.status,
        startedAt: room.startedAt,
      },
    };
  }

  // 2.4 POST /rooms/terminate - ゲームを強制終了（ホスト専用）
  @Post('terminate')
  @UseGuards(RoomAuthGuard, HostGuard)
  @HttpCode(HttpStatus.OK)
  async terminateGame(
    @CurrentUser() user: JwtPayload,
  ) {
    const room = await this.roomsService.terminateGame(user.roomId);

    // タイマーを停止
    this.gameGateway.stopGameTimer(user.roomId);

    // WebSocketでゲーム終了通知を送信
    await this.gameGateway.sendGameTerminated(user.roomId, GameTerminationReason.TERMINATED_BY_HOST);

    // WebSocketで状態を通知
    await this.gameGateway.sendGameStatus(user.roomId);

    return {
      message: 'ゲームを終了しました',
      room: {
        id: room.id,
        status: room.status,
      },
    };
  }

  // 2.5 GET /rooms/result - ゲーム結果を取得
  @Get('result')
  @UseGuards(RoomAuthGuard)
  async getResult(
    @CurrentUser() user: JwtPayload,
    @CurrentRoom() room: Room,
  ) {
    // 部屋に所属するプレイヤー一覧を取得
    const players = await this.playersService.findByRoomId(user.roomId);

    return {
      room: {
        id: room.id,
        status: room.status,
        startedAt: room.startedAt,
        durationSeconds: room.durationSeconds,
      },
      players: players.map((player) => ({
        id: player.id,
        playerName: player.playerName,
        role: player.role,
        isCaptured: player.isCaptured,
      })),
    };
  }

  // 2.6 POST /rooms/close - 参加受付を終了(ホスト専用)
  @Post('close')
  @UseGuards(RoomAuthGuard, HostGuard)
  @HttpCode(HttpStatus.OK)
  async closeEntry(
    @CurrentUser() user: JwtPayload,
  ) {
    await this.roomsService.closeEntry(user.roomId);

    // WebSocketで状態を通知
    await this.gameGateway.sendGameStatus(user.roomId);

    return {
      message: '参加受付を終了しました',
    };
  }

  // 2.7 POST /rooms/reset - ロビーに戻る（ホスト専用）
  @Post('reset')
  @UseGuards(RoomAuthGuard, HostGuard)
  @HttpCode(HttpStatus.OK)
  async resetToLobby(
    @CurrentUser() user: JwtPayload,
    @CurrentRoom() room: Room,
  ) {
    // タイマーを停止（念のため）
    this.gameGateway.stopGameTimer(room.id);

    // プレイヤーの捕獲状態をリセット
    await this.playersService.resetCaptureStatus(room.id);
    
    // 部屋の状態をロビーに戻す
    const resetRoom = await this.roomsService.resetToLobby(room.id);

    // WebSocketで状態を通知
    await this.gameGateway.sendGameStatus(room.id);

    return {
      message: 'ロビーに戻りました',
      room: {
        id: resetRoom.id,
        status: resetRoom.status,
        startedAt: resetRoom.startedAt,
      },
    };
  }

  // 2.8 DELETE /rooms - ルームを解散する（ホスト専用）
  @Delete()
  @UseGuards(RoomAuthGuard, HostGuard)
  @HttpCode(HttpStatus.OK)
  async deleteRoom(
    @CurrentUser() user: JwtPayload,
    @CurrentRoom() room: Room,
  ) {
    // タイマーを停止
    this.gameGateway.stopGameTimer(room.id);

    // WebSocketで全プレイヤーに部屋解散を通知
    await this.gameGateway.sendRoomDisbanded(room.id);

    // 部屋を削除（CASCADE により所属プレイヤーも自動削除）
    await this.roomsService.remove(room.id);

    return {
      message: 'ルームを解散しました',
    };
  }

  // 2.9 POST /rooms/leave - 部屋から退出する
  @Post('leave')
  @UseGuards(RoomAuthGuard)
  @HttpCode(HttpStatus.OK)
  async leaveRoom(
    @CurrentUser() user: JwtPayload,
    @CurrentRoom() room: Room,
  ) {
    const player = await this.playersService.findById(user.playerId);
    
    if (!player) {
      throw new Error('プレイヤーが見つかりません');
    }

    // ホストが退出する場合は部屋を解散
    if (user.isHost) {
      // タイマーを停止
      this.gameGateway.stopGameTimer(room.id);

      // WebSocketで全プレイヤーに部屋解散を通知
      await this.gameGateway.sendRoomDisbanded(room.id);

      // 部屋を削除（CASCADE により所属プレイヤーも自動削除）
      await this.roomsService.remove(room.id);

      return {
        message: 'ホストが退出したため、ルームを解散しました',
        isRoomDisbanded: true,
      };
    }

    // 一般プレイヤーの場合
    // プレイヤーを削除
    await this.playersService.remove(user.playerId);

    // WebSocketで退出通知を送信
    await this.gameGateway.sendPlayerLeft(room.id, player.id, player.playerName);

    // WebSocketで状態を通知
    await this.gameGateway.sendGameStatus(room.id);

    return {
      message: '部屋から退出しました',
      isRoomDisbanded: false,
    };
  }
}
