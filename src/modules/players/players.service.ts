import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreatePlayerDto } from './dto/create-player.dto';
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
  create(
    playerName: string,
    roomId: string,
    role: PlayerRole = PlayerRole.THIEF,
  ): Promise<Player> {
    const player = this.playerRepository.create({
      playerName,
      roomId,
      role,
      isCaptured: false,
      isConnected: true,
    });
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

  findAll() {
    return `This action returns all players`;
  }

  findOne(id: number) {
    return `This action returns a #${id} player`;
  }

  update(id: number, updatePlayerDto: UpdatePlayerDto) {
    return `This action updates a #${id} player`;
  }

  remove(id: number) {
    return `This action removes a #${id} player`;
  }
}
