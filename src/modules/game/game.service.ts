import { Injectable, ConflictException } from '@nestjs/common';
import { RoomsService } from '../rooms/rooms.service';
import { PlayersService } from '../players/players.service';
import { JwtService } from '@nestjs/jwt';
import { CreateRoomDto } from '../rooms/dto/create-room.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { PlayerRole } from '../players/entities/player.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class GameService {
  constructor(
    private readonly roomsService: RoomsService,
    private readonly playersService: PlayersService,
    private readonly jwtService: JwtService,
  ) {}
  // POST /rooms 部屋を作成（ホストも同時に作成）
  async createRoomWithHost(dto: CreateRoomDto) {
    const { playerName, passcode } = dto;

    const passcodeHash = await bcrypt.hash(passcode, 10);

    const exitstingRoom = await this.roomsService.findByPasscodeHash(passcodeHash);
    if (exitstingRoom) {
      throw new ConflictException('この合言葉は既に使用されています');
    }

    // 仮のホストIDで部屋を作成
    const tempHostId = 'temp-' + Date.now();
    const room = await this.roomsService.create(passcodeHash, tempHostId);

    try {
      const hostPlayer = await this.playersService.create(
        playerName, 
        room.id, 
        PlayerRole.POLICE
      );

      room.hostPlayerId = hostPlayer.id;
      await this.roomsService.updateStatus(room.id, room.status);

      const playerToken = this.jwtService.sign({
        playerId: hostPlayer.id,
        roomId: room.id,
        isHost: true,
      });

      return {
        playerToken,
        passcode,
        playerId: hostPlayer.id,
        roomId: room.id,
      };
    } catch (error) {
      // ホストプレイヤーの作成に失敗した場合、作成した部屋を削除
      await this.roomsService.remove(room.id);
      throw error;
    }
  }

  findAll() {
    return `This action returns all game`;
  }

  findOne(id: number) {
    return `This action returns a #${id} game`;
  }

  update(id: number, updateGameDto: UpdateGameDto) {
    return `This action updates a #${id} game`;
  }

  remove(id: number) {
    return `This action removes a #${id} game`;
  }
}
