import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DB_MAX_CONNECTIONS, DB_MIN_CONNECTIONS, DB_IDLE_TIMEOUT } from '../common/constants';

export const getDatabaseConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'user_db',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: process.env.NODE_ENV !== 'production', // Auto-sync in development
  logging: process.env.NODE_ENV !== 'production',
  extra: {
    max: DB_MAX_CONNECTIONS,
    min: DB_MIN_CONNECTIONS,
    idleTimeoutMillis: DB_IDLE_TIMEOUT,
  },
});
