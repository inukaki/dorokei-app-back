import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class JoinRoomDto {
    @IsString({ message: 'プレイヤー名は文字列で入力してください。' })
    @IsNotEmpty({ message: 'プレイヤー名を入力してください。' })
    @Length(1, 30, { message: 'プレイヤー名は1〜30文字で入力してください。' })
    playerName: string;

    @IsString({ message: '合言葉は文字列で入力してください。' })
    @IsNotEmpty({ message: '合言葉を入力してください。' })
    @Length(6, 20, { message: '合言葉は6〜20文字で入力してください。' })
    @Matches(/^[a-zA-Z0-9]+$/, { message: '合言葉は半角英数字のみで入力してください。' })
    passcode: string;
}