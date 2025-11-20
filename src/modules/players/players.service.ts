import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player, PlayerRole } from './entities/player.entity';

@Injectable()
export class PlayersService {
  constructor(
    @InjectRepository(Player)
    private readonly playerRepository: Repository<Player>,
  ) {}

  // プレイヤーを作成
  async create(
    playerName: string,
    roomId: string | null,
    role: PlayerRole = PlayerRole.THIEF,
  ): Promise<Player> {
    const playerData: any = {
      playerName,
      role,
      isCaptured: false,
      isConnected: true,
    };
    
    if (roomId !== null) {
      playerData.roomId = roomId;
    }
    
    const player = this.playerRepository.create(playerData);
    const saved = await this.playerRepository.save(player);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  // プレイヤーのroomIdを更新
  async updateRoomId(playerId: string, roomId: string): Promise<Player> {
    const player = await this.findById(playerId);
    if (!player) {
      throw new NotFoundException(`プレイヤーが見つかりません`);
    }
    player.roomId = roomId;
    return this.playerRepository.save(player);
  }

  async findByRoomId(roomId: string): Promise<Player[]> {
    return this.playerRepository.find({ where: { roomId } });
  }

  // IDでプレイヤーを検索
  async findById(id: string): Promise<Player | null> {
    return this.playerRepository.findOne({ where: { id } });
  }

  // プレイヤーを捕獲する
  async capturePlayer(playerId: string): Promise<Player> {
    const player = await this.findById(playerId);
    if (!player) {
      throw new NotFoundException('プレイヤーが見つかりません');
    }

    if (player.role === PlayerRole.POLICE) {
      throw new BadRequestException('警察は捕獲できません');
    }

    if (player.isCaptured) {
      throw new BadRequestException('既に捕獲されています');
    }

    player.isCaptured = true;
    return this.playerRepository.save(player);
  }

  // プレイヤーを解放する
  async releasePlayer(playerId: string): Promise<Player> {
    const player = await this.findById(playerId);
    if (!player) {
      throw new NotFoundException('プレイヤーが見つかりません');
    }

    if (player.role === PlayerRole.POLICE) {
      throw new BadRequestException('警察は解放できません');
    }

    if (!player.isCaptured) {
      throw new BadRequestException('捕獲されていません');
    }

    player.isCaptured = false;
    return this.playerRepository.save(player);
  }

  // 部屋のプレイヤーの捕獲状態をリセット
  async resetCaptureStatus(roomId: string): Promise<void> {
    await this.playerRepository.update(
      { roomId, role: PlayerRole.THIEF },
      { isCaptured: false },
    );
  }

  // 泥棒が全員捕まっているかチェック
  async areAllThievesCaptured(roomId: string): Promise<boolean> {
    const thieves = await this.playerRepository.find({
      where: { roomId, role: PlayerRole.THIEF },
    });

    // 泥棒が1人もいない場合はfalse
    if (thieves.length === 0) {
      return false;
    }

    // 全ての泥棒が捕まっているかチェック
    return thieves.every(thief => thief.isCaptured);
  }

  // プレイヤーの接続状態を更新
  async updateConnectionStatus(id: string, isConnected: boolean): Promise<Player> {
    const player = await this.findById(id);
    if (!player) {
      throw new NotFoundException(`プレイヤーが見つかりません`);
    }

    player.isConnected = isConnected;
    return this.playerRepository.save(player);
  }

  findAll() {
    return `This action returns all players`;
  }

  findOne(id: string) {
    return this.findById(id);
  }

  findOneOld(id: number) {
    return `This action returns a #${id} player`;
  }

  update(id: number, updatePlayerDto: UpdatePlayerDto) {
    return `This action updates a #${id} player`;
  }

  async remove(id: string): Promise<void> {
    const player = await this.findById(id);
    if (!player) {
      throw new NotFoundException(`プレイヤーが見つかりません`);
    }
    await this.playerRepository.remove(player);
  }
}
