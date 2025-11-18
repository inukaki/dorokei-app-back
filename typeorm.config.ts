import { DataSource, DataSourceOptions } from "typeorm";
import { config } from 'dotenv';
import { Room } from "./src/modules/rooms/entities/room.entity";
import { Player } from "./src/modules/players/entities/player.entity";

config();

const isDevelopment = process.env.NODE_ENV !== 'production';
const synchronizeEnabled = process.env.DB_SYNCHRONIZE === 'true';

export const typeOrmConfig: DataSourceOptions = {
    type: isDevelopment ? 'mysql' : 'postgres',  // 開発環境では MySQL、本番環境では PostgreSQL
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    synchronize: isDevelopment && synchronizeEnabled,
    logging: isDevelopment ? ['query', 'error'] : false,
    entities: [Room, Player],
    // entities: isDevelopment
    //     ? [__dirname + '/src/modules/**/*.entity.ts']  // 開発環境
    //     : [__dirname + '/dist/modules/**/*.entity.js'], // 本番環境
    migrations: isDevelopment
        ? [__dirname + '/src/migrations/**/*{.ts,.js}']  // 開発環境
        : [__dirname + '/dist/migrations/**/*{.ts,.js}'], // 本番環境
};

export default new DataSource(typeOrmConfig);