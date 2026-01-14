import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from './infrastructure/database/database.config';
import { RedisModule } from './infrastructure/redis/redis.module';
import { UserModule } from './application/user.module';
import { UserGrpcController } from './presentation/grpc/user-grpc.controller';

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
  controllers: [UserGrpcController],
})
export class AppModule {}
