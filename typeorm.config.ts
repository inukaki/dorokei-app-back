import { DataSource, DataSourceOptions } from "typeorm";
import { config } from 'dotenv';

config();

const isDevelopment = process.env.NODE_ENV !== 'production';
const synchronizeEnabled = process.env.DB_SYNCHRONIZE === 'true';

export const typeOrmConfig: DataSourceOptions = {
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    synchronize: isDevelopment && synchronizeEnabled,
    logging: isDevelopment ? ['query', 'error'] : false,
    entities: isDevelopment
        ? [__dirname + '/src/**/*.entity.ts']  // 開発環境
        : [__dirname + '/dist/**/*.entity.js'], // 本番環境
    migrations: isDevelopment
        ? [__dirname + '/src/migrations/**/*{.ts,.js}']  // 開発環境
        : [__dirname + '/dist/migrations/**/*{.ts,.js}'], // 本番環境
};

export default new DataSource(typeOrmConfig);