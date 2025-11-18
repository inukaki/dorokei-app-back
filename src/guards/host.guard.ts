import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';

/**
 * ホスト専用ガード
 * RoomAuthGuardの後に使用し、リクエストユーザーがホストであることを確認する
 */
@Injectable()
export class HostGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request['user'];
    const room = request['room'];

    if (!user || !room) {
      throw new ForbiddenException('認証情報が不足しています');
    }

    // JWTペイロードのisHostフラグを確認
    if (!user.isHost) {
      throw new ForbiddenException('この操作はホストのみが実行できます');
    }

    // 念のため、プレイヤーIDが部屋のホストIDと一致するか確認
    if (user.playerId !== room.hostPlayerId) {
      throw new ForbiddenException('この操作はホストのみが実行できます');
    }

    return true;
  }
}
