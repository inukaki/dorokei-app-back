import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Socket } from 'socket.io';
import { JwtPayload } from '../types/express';

export const WsCurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): JwtPayload => {
    const client: Socket = ctx.switchToWs().getClient();
    return client.data.user;
  },
);
