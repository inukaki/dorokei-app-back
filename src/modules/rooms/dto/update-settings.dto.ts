import { IsString, IsNotEmpty, IsInt, Min, Max, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';

/**
 * ゲーム設定更新用DTO
 * ホストがゲーム開始前に設定を変更する際に使用
 */
export class UpdateSettingsDto {
  @IsString()
  @IsNotEmpty({ message: '合言葉は必須です' })
  @MinLength(6, { message: '合言葉は6文字以上で入力してください' })
  @MaxLength(20, { message: '合言葉は20文字以内で入力してください' })
  @Matches(/^[a-zA-Z0-9]+$/, { message: '合言葉は英数字のみで入力してください' })
  passcode: string;

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
}
