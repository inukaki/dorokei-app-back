import { Module, forwardRef } from '@nestjs/common';
import { GameService } from './game.service';
import { GameController } from './game.controller';
import { GameGateway } from './game.gateway';
import { RoomsModule } from '../rooms/rooms.module';
import { PlayersModule } from '../players/players.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WsAuthGuard, WsRoomAuthGuard } from '../../guards';

@Module({
  imports: [
    forwardRef(() => RoomsModule),
    forwardRef(() => PlayersModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '24h' },
      }),
    })
  ],
  controllers: [GameController],
  providers: [GameService, GameGateway, WsAuthGuard, WsRoomAuthGuard],
  exports: [GameService, GameGateway],
})
export class GameModule {}
