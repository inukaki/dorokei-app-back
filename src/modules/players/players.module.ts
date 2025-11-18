import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PlayersService } from './players.service';
import { PlayersController } from './players.controller';
import { TypeOrmModule } from '@nestjs/typeorm';  
import { Player } from './entities/player.entity';
import { RoomsModule } from '../rooms/rooms.module';
import { GameModule } from '../game/game.module';
import { RoomAuthGuard } from '../../guards';

@Module({
  imports: [
    TypeOrmModule.forFeature([Player]),
    forwardRef(() => RoomsModule),  // ← forwardRef() で循環依存を解決
    forwardRef(() => GameModule),  // GameGatewayを使用するため
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dorokei-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [PlayersController],
  providers: [PlayersService, RoomAuthGuard],
  exports: [PlayersService],
})
export class PlayersModule {}
