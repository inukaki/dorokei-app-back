import { IsOptional, IsInt, Min, Max, IsEnum } from 'class-validator';
import { RoomStatus } from '../entities/room.entity';

export class UpdateRoomDto {
  @IsOptional()
  @IsInt({ message: 'ゲーム時間は整数で指定してください' })
  @Min(60, { message: 'ゲーム時間は60秒以上で設定してください' })
  @Max(3600, { message: 'ゲーム時間は3600秒以下で設定してください' })
  durationSeconds?: number;

  @IsOptional()
  @IsInt({ message: '猶予時間は整数で指定してください' })
  @Min(0, { message: '猶予時間は0秒以上で設定してください' })
  @Max(300, { message: '猶予時間は300秒以下で設定してください' })
  gracePeriodSeconds?: number;

  @IsOptional()
  @IsInt({ message: '最大プレイヤー数は整数で指定してください' })
  @Min(2, { message: '最大プレイヤー数は2人以上で設定してください' })
  @Max(15, { message: '最大プレイヤー数は15人以下で設定してください' })
  maxPlayers?: number;

  @IsOptional()
  @IsEnum(RoomStatus, { message: '無効なステータスです' })
  status?: RoomStatus;
}
