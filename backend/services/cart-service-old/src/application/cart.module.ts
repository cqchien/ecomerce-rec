import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { CartEntity } from '../infrastructure/persistence/entities/cart.entity';
import { CartItemEntity } from '../infrastructure/persistence/entities/cart-item.entity';
import { CartService } from './services/cart.service';
import { CartController } from '../presentation/http/cart.controller';
import { CartCleanupTask } from '../infrastructure/tasks/cart-cleanup.task';
import { RedisModule } from '../infrastructure/redis/redis.module';
import { RedisCacheService } from '../infrastructure/cache/redis-cache.service';
import { KafkaEventPublisherService } from '../infrastructure/events/kafka-event-publisher.service';
import { CartRepository } from '../infrastructure/repositories/cart.repository';
import { CartItemRepository } from '../infrastructure/repositories/cart-item.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([CartEntity, CartItemEntity]),
    ScheduleModule.forRoot(),
    RedisModule,
  ],
  providers: [
    CartService,
    CartCleanupTask,
    RedisCacheService,
    KafkaEventPublisherService,
    CartRepository,
    CartItemRepository,
    {
      provide: 'ICacheService',
      useClass: RedisCacheService,
    },
    {
      provide: 'IEventPublisher',
      useClass: KafkaEventPublisherService,
    },
    {
      provide: 'ICartRepository',
      useClass: CartRepository,
    },
    {
      provide: 'ICartItemRepository',
      useClass: CartItemRepository,
    },
  ],
  controllers: [CartController],
  exports: [CartService],
})
export class CartModule {}

