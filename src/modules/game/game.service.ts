import { Injectable, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { RoomsService } from '../rooms/rooms.service';
import { PlayersService } from '../players/players.service';
import { JwtService } from '@nestjs/jwt';
import { CreateRoomDto } from '../rooms/dto/create-room.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { PlayerRole } from '../players/entities/player.entity';
import * as bcrypt from 'bcrypt';
import { JoinRoomDto } from '../rooms/dto/join-room.dto';
import { RoomStatus } from '../rooms/entities/room.entity';

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

    const allRooms = await this.roomsService.findAll();
    for (const room of allRooms) {
      const isMatch = await bcrypt.compare(passcode, room.passcode_hash);
      if (isMatch) {
        throw new ConflictException('この合言葉は既に使用されています');
      }
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
      await this.roomsService.update(room.id, { hostPlayerId: hostPlayer.id });

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

  // POST /rooms/join 部屋に参加
  async joinRoom(dto: JoinRoomDto) {
    const { playerName, passcode } = dto;

    const allRooms = await this.roomsService.findAll();
    
    let matchedRoom: typeof allRooms[0] | null = null;
    for (const room of allRooms) {
      const isMatch = await bcrypt.compare(passcode, room.passcode_hash);
      if (isMatch) {
        matchedRoom = room;
        break;
      }
    }

    if (!matchedRoom) {
      throw new NotFoundException('指定された合言葉の部屋は存在しません');
    }

    if (matchedRoom.status !== RoomStatus.WAITING) {
      throw new BadRequestException('この部屋はゲーム中のため参加できません');
    }

    const currentPlayers = await this.playersService.findByRoomId(matchedRoom.id);
    if (currentPlayers.length >= matchedRoom.maxPlayers) {
      throw new BadRequestException('この部屋は満員です');
    }
    const player = await this.playersService.create(
      playerName,
      matchedRoom.id,
      PlayerRole.THIEF,
    );

    const playerToken = this.jwtService.sign({
      playerId: player.id,
      roomId: matchedRoom.id,
      isHost: false,
    });

    return {
      playerToken,
      passcode,
      playerId: player.id,
      roomId: matchedRoom.id,
    };
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
