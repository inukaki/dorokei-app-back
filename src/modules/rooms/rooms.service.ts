import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room, RoomStatus } from './entities/room.entity';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
  ) {}

  // 部屋を作成
  create(passcodeHash: string, hostPlayerId: string): Promise<Room> {
    const room = this.roomRepository.create({
      passcode_hash: passcodeHash,
      hostPlayerId: hostPlayerId,
      status: RoomStatus.WAITING,
      durationSeconds: 600,
      gracePeriodSeconds: 30,
    });
    return this.roomRepository.save(room);
  }

  // 合言葉のハッシュで部屋を検索
  findByPasscodeHash(passcodeHash: string): Promise<Room | null> {
    return this.roomRepository.findOne({
      where: { passcode_hash: passcodeHash },
    });
  }

  // IDで部屋を検索
  findById(id: string): Promise<Room | null> {
    return this.roomRepository.findOne({
      where: { id },
    });
  }

  // 部屋のステータスを更新
  async updateStatus(id: string, status: RoomStatus): Promise<Room> {
    const room = await this.findById(id);
    if (!room) {
      throw new NotFoundException('部屋が見つかりません');
    }
    room.status = status;
    return this.roomRepository.save(room);
  }

  // 部屋を削除
  async remove(id: string): Promise<void> {
    await this.roomRepository.delete(id);
  }

  findAll(): Promise<Room[]> {
    return this.roomRepository.find();
  }

  // 部屋の情報を更新
  async update(id: string, updateRoomDto: UpdateRoomDto): Promise<Room> {
    const room = await this.findById(id);
    if (!room) {
      throw new NotFoundException('部屋が見つかりません');
    }
    
    // DTOで定義されたフィールドのみを更新
    if (updateRoomDto.durationSeconds !== undefined) {
      room.durationSeconds = updateRoomDto.durationSeconds;
    }
    if (updateRoomDto.gracePeriodSeconds !== undefined) {
      room.gracePeriodSeconds = updateRoomDto.gracePeriodSeconds;
    }
    if (updateRoomDto.maxPlayers !== undefined) {
      room.maxPlayers = updateRoomDto.maxPlayers;
    }
    if (updateRoomDto.status !== undefined) {
      room.status = updateRoomDto.status;
    }
    
    return this.roomRepository.save(room);
  }

  // 内部用: ホストプレイヤーIDを更新（GameServiceから使用）
  async updateHostPlayerId(id: string, hostPlayerId: string): Promise<Room> {
    const room = await this.findById(id);
    if (!room) {
      throw new NotFoundException('部屋が見つかりません');
    }
    room.hostPlayerId = hostPlayerId;
    return this.roomRepository.save(room);
  }

  // ゲームを開始
  async startGame(id: string): Promise<Room> {
    const room = await this.findById(id);
    if (!room) {
      throw new NotFoundException('部屋が見つかりません');
    }
    room.status = RoomStatus.IN_GAME;
    room.startedAt = new Date();
    return this.roomRepository.save(room);
  }

  // ゲームを強制終了
  async terminateGame(id: string): Promise<Room> {
    const room = await this.findById(id);
    if (!room) {
      throw new NotFoundException('部屋が見つかりません');
    }
    room.status = RoomStatus.FINISHED;
    return this.roomRepository.save(room);
  }

  // 参加受付を終了
  async closeEntry(id: string): Promise<Room> {
    const room = await this.findById(id);
    if (!room) {
      throw new NotFoundException('部屋が見つかりません');
    }
    room.status = RoomStatus.CLOSED;
    return this.roomRepository.save(room);
  }

  // ロビーに戻る（リセット）
  async resetToLobby(id: string): Promise<Room> {
    const room = await this.findById(id);
    if (!room) {
      throw new NotFoundException('部屋が見つかりません');
    }

    if (room.status !== RoomStatus.FINISHED) {
      throw new BadRequestException('ゲームが終了していません');
    }

    room.status = RoomStatus.WAITING;
    room.startedAt = null;
    return this.roomRepository.save(room);
  }
}
