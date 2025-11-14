import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { JwtPayload } from '../types/express';

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient();
      const data = context.switchToWs().getData();

      // playerTokenを取得
      const token = data.playerToken;
      if (!token) {
        throw new WsException('認証トークンが必要です');
      }

      // JWTを検証
      const payload = this.jwtService.verify<JwtPayload>(token);

      // クライアントオブジェクトにユーザー情報を追加
      client.data.user = payload;

      return true;
    } catch (error) {
      if (error instanceof WsException) {
        throw error;
      }
      throw new WsException('認証に失敗しました');
    }
  }
}
