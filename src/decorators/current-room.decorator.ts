import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Room } from '../modules/rooms/entities/room.entity';

/**
 * 現在の部屋情報を取得するカスタムデコレータ
 * RoomAuthGuard が適用されている必要があります
 */
export const CurrentRoom = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Room => {
    const request = ctx.switchToHttp().getRequest();
    if (!request.room) {
      throw new Error('Room not found in request. Did you forget to apply RoomAuthGuard?');
    }
    return request.room;
  },
);
