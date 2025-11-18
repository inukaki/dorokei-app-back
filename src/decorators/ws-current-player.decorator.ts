import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Socket } from 'socket.io';
import { Player } from '../modules/players/entities/player.entity';

export const WsCurrentPlayer = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): Player => {
    const client: Socket = ctx.switchToWs().getClient();
    return client.data.player;
  },
);
