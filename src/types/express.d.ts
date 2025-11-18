import { Room } from '../modules/rooms/entities/room.entity';

/**
 * JWT ペイロード型定義
 */
export interface JwtPayload {
  playerId: string;
  roomId: string;
  isHost: boolean;
}

/**
 * Express Request の拡張型定義
 */
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
      room?: Room;
    }
  }
}
