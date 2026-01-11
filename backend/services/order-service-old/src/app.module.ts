import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderModule } from './infrastructure/modules/order.module';
import { RedisModule } from './infrastructure/modules/redis.module';
import { HealthController } from './presentation/controllers/health.controller';
import { OrderEntity } from './infrastructure/persistence/entities/order.entity';
import { OrderItemEntity } from './infrastructure/persistence/entities/order-item.entity';
import { OrderStatusHistoryEntity } from './infrastructure/persistence/entities/order-status-history.entity';
import { DB_CONFIG } from './common/constants';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USER', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_NAME', 'order_db'),
        entities: [OrderEntity, OrderItemEntity, OrderStatusHistoryEntity],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') === 'development',
        extra: {
          max: DB_CONFIG.MAX_CONNECTIONS,
          min: DB_CONFIG.MIN_CONNECTIONS,
          acquire: DB_CONFIG.ACQUIRE_TIMEOUT,
          idle: DB_CONFIG.IDLE_TIMEOUT,
        },
      }),
      inject: [ConfigService],
    }),
    RedisModule,
    OrderModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
