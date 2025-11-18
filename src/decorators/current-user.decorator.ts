import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../types/express';

/**
 * 現在のユーザー情報を取得するカスタムデコレータ
 * AuthGuard または RoomAuthGuard が適用されている必要があります
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest();
    if (!request.user) {
      throw new Error('User not found in request. Did you forget to apply AuthGuard?');
    }
    return request.user;
  },
);
