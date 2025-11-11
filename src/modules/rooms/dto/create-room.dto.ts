import { IsNotEmpty, IsString, MinLength, MaxLength, Matches } from "class-validator";

export class CreateRoomDto {
    @IsString()
    @IsNotEmpty({ message: 'プレイヤー名は必須です。' })
    @MinLength(1, { message: 'プレイヤー名は1文字以上で入力してください。' })
    @MaxLength(30, { message: 'プレイヤー名は30文字以内で入力してください。' })
    playerName: string;

    @IsString()
    @IsNotEmpty({ message: '合言葉は必須です。' })
    @MinLength(6, { message: '合言葉は6文字以上で入力してください。' })
    @MaxLength(20, { message: '合言葉は20文字以内で入力してください。' })
    @Matches(/^[a-zA-Z0-9]+$/, { message: '合言葉は英数字のみで入力してください。' })
    passcode: string;
}
