import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from './infrastructure/database/database.config';
import { RedisModule } from './infrastructure/redis/redis.module';
import { UserModule } from './application/user.module';
import { HealthController } from './presentation/http/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot(getDatabaseConfig()),
    RedisModule,
    UserModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
