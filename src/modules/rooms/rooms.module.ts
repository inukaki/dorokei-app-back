import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { TypeOrmModule } from '@nestjs/typeorm';  
import { Room } from './entities/room.entity';
import { PlayersModule } from '../players/players.module';
import { AuthGuard, RoomAuthGuard, HostGuard } from '../../guards';

@Module({
  imports: [
    TypeOrmModule.forFeature([Room]),
    PlayersModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [RoomsController],
  providers: [RoomsService, AuthGuard, RoomAuthGuard, HostGuard],
  exports: [RoomsService],
})
export class RoomsModule {}
