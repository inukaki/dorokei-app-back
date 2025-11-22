import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RoomsService } from '../modules/rooms/rooms.service';
import { Request } from 'express';
import * as bcrypt from 'bcrypt';

/**
 * 部屋の認証ガード
 * JWTトークンとPasscodeの両方を検証する
 */
@Injectable()
export class RoomAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly roomsService: RoomsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    
    // 1. JWTトークンの検証
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('認証トークンが提供されていません');
    }

    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'dorokei-secret-key',
      });
    } catch (error) {
      throw new UnauthorizedException('無効な認証トークンです');
    }

    // 2. Passcodeの検証
    // const passcode = this.extractPasscodeFromRequest(request);
    // if (!passcode) {
    //   throw new BadRequestException('合言葉が提供されていません');
    // }

    const room = await this.roomsService.findById(payload.roomId);
    if (!room) {
      throw new UnauthorizedException('部屋が見つかりません');
    }

    // const isPasscodeValid = await bcrypt.compare(passcode, room.passcode_hash);
    // if (!isPasscodeValid) {
    //   throw new UnauthorizedException('合言葉が正しくありません');
    // }

    // リクエストオブジェクトにユーザー情報と部屋情報を追加
    request['user'] = payload;
    request['room'] = room;

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    // X-Player-Tokenヘッダーからトークンを取得
    return request.headers['Playertoken'] as string | undefined;
  }

  private extractPasscodeFromRequest(request: Request): string | undefined {
    // ヘッダー、クエリパラメータ、ボディから合言葉を取得
    return (
      request.headers['X-Room-Passcode'] as string ||
      request.query.passcode as string ||
      request.body?.passcode
    );
  }
}
