import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { PlayersService } from './players.service';
import { GameGateway } from '../game/game.gateway';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { RoomAuthGuard } from '../../guards';
import { CurrentUser } from '../../decorators';
import { JwtPayload } from '../../types/express';
import { PlayerRole } from './entities/player.entity';

@Controller('rooms/players')
export class PlayersController {
  constructor(
    private readonly playersService: PlayersService,
    private readonly gameGateway: GameGateway,
  ) {}

  // 3.1 PATCH /rooms/players/:playerId/capture - プレイヤーを捕獲
  @Patch(':playerId/capture')
  @UseGuards(RoomAuthGuard)
  @HttpCode(HttpStatus.OK)
  async capturePlayer(
    @Param('playerId') playerId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    // 捕獲を実行するプレイヤーが警察であることを確認
    const executor = await this.playersService.findById(user.playerId);
    if (!executor || executor.role !== PlayerRole.POLICE) {
      throw new BadRequestException('警察のみが捕獲できます');
    }

    await this.playersService.capturePlayer(playerId);

    // WebSocketで状態を通知
    await this.gameGateway.sendGameStatus(user.roomId);

    return {
      message: 'プレイヤーを捕獲しました',
    };
  }

  // 3.2 PATCH /rooms/players/:playerId/release - プレイヤーを解放
  @Patch(':playerId/release')
  @UseGuards(RoomAuthGuard)
  @HttpCode(HttpStatus.OK)
  async releasePlayer(
    @Param('playerId') playerId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    // 解放を実行するプレイヤーが泥棒であることを確認
    const executor = await this.playersService.findById(user.playerId);
    if (!executor || executor.role !== 'THIEF') {
      throw new BadRequestException('泥棒のみが解放できます');
    }

    await this.playersService.releasePlayer(playerId);

    // WebSocketで状態を通知
    await this.gameGateway.sendGameStatus(user.roomId);

    return {
      message: 'プレイヤーを解放しました',
    };
  }

  @Get()
  findAll() {
    return this.playersService.findAll();
  }

}
