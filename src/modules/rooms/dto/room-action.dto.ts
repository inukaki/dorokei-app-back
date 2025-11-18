import { IsString, IsNotEmpty, MinLength, MaxLength, Matches } from 'class-validator';

/**
 * ゲーム開始/終了/参加受付終了用DTO
 * ホストがアクションを実行する際に使用
 */
export class RoomActionDto {
  @IsString()
  @IsNotEmpty({ message: '合言葉は必須です' })
  @MinLength(6, { message: '合言葉は6文字以上で入力してください' })
  @MaxLength(20, { message: '合言葉は20文字以内で入力してください' })
  @Matches(/^[a-zA-Z0-9]+$/, { message: '合言葉は英数字のみで入力してください' })
  passcode: string;
}
