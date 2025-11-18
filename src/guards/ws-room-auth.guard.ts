import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { PlayersService } from '../modules/players/players.service';
import { RoomsService } from '../modules/rooms/rooms.service';
import { JwtPayload } from '../types/express';

@Injectable()
export class WsRoomAuthGuard implements CanActivate {
  constructor(
    private readonly playersService: PlayersService,
    private readonly roomsService: RoomsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient();
      const user: JwtPayload = client.data.user;

      if (!user) {
        throw new WsException('認証が必要です');
      }

      const { playerId, roomId } = user;

      // プレイヤーの存在確認
      const player = await this.playersService.findOne(playerId);
      if (!player) {
        throw new WsException('プレイヤーが見つかりません');
      }

      // プレイヤーが指定された部屋に所属しているか確認
      if (player.roomId !== roomId) {
        throw new WsException('部屋の情報が一致しません');
      }

      // 部屋の存在確認
      const room = await this.roomsService.findById(roomId);
      if (!room) {
        throw new WsException('部屋が見つかりません');
      }

      // クライアントオブジェクトに部屋とプレイヤー情報を追加
      client.data.room = room;
      client.data.player = player;

      return true;
    } catch (error) {
      if (error instanceof WsException) {
        throw error;
      }
      throw new WsException('認証に失敗しました');
    }
  }
}
