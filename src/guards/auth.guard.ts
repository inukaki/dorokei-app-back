import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

/**
 * JWT認証ガード
 * X-Player-Tokenヘッダーからトークンを検証し、リクエストにユーザー情報を追加する
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('認証トークンが提供されていません');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'dorokei-secret-key',
      });

      // リクエストオブジェクトにユーザー情報を追加
      request['user'] = payload;
    } catch (error) {
      throw new UnauthorizedException('無効な認証トークンです');
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    // X-Player-Tokenヘッダーからトークンを取得
    return request.headers['Playertoken'] as string | undefined;
  }
}
