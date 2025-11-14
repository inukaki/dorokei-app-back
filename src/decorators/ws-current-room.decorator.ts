import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Socket } from 'socket.io';
import { Room } from '../modules/rooms/entities/room.entity';

export const WsCurrentRoom = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Room => {
    const client: Socket = ctx.switchToWs().getClient();
    return client.data.room;
  },
);
