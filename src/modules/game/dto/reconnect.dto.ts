import { IsString, IsNotEmpty } from 'class-validator';

export class ReconnectDto {
  @IsString()
  @IsNotEmpty()
  playerToken: string;
}
