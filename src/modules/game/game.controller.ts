import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { GameService } from './game.service';
import { CreateRoomDto } from '../rooms/dto/create-room.dto';
import { UpdateGameDto } from './dto/update-game.dto';

@Controller('rooms')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post()
  createRoom(@Body() createRoomDto: CreateRoomDto) {
    return this.gameService.createRoomWithHost(createRoomDto);
  }

  @Get()
  findAll() {
    return this.gameService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.gameService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateGameDto: UpdateGameDto) {
    return this.gameService.update(+id, updateGameDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.gameService.remove(+id);
  }
}
