import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomsModule } from './modules/rooms/rooms.module';
import { PlayersModule } from './modules/players/players.module';
import { typeOrmConfig } from 'typeorm.config';
import { GameModule } from './modules/game/game.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(typeOrmConfig),
    RoomsModule,
    PlayersModule,
    GameModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
