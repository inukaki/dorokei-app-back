import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';
import { CreateRoomDto } from '../rooms/dto/create-room.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { JoinRoomDto } from '../rooms/dto/join-room.dto';

@Controller('rooms')
export class GameController {
  constructor(
    private readonly gameService: GameService,
    private readonly gameGateway: GameGateway,
  ) {}

  @Post('join')
  async joinRoom(@Body() joinRoomDto: JoinRoomDto) {
    const result = await this.gameService.joinRoom(joinRoomDto);
    
    // WebSocketで状態を通知（新しいプレイヤーが参加）
    await this.gameGateway.sendGameStatus(result.roomId);
    
    return result;
  }

  @Post('create')
  createRoom(@Body() createRoomDto: CreateRoomDto) {
    return this.gameService.createRoomWithHost(createRoomDto);
  }
}
