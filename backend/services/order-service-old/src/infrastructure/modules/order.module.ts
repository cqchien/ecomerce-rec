import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderEntity } from '../persistence/entities/order.entity';
import { OrderItemEntity } from '../persistence/entities/order-item.entity';
import { OrderStatusHistoryEntity } from '../persistence/entities/order-status-history.entity';
import { OrderService } from '../../application/services/order.service';
import { OrderController } from '../../presentation/controllers/order.controller';
import { OrderRepository } from '../repositories/order.repository';
import { OrderItemRepository } from '../repositories/order-item.repository';
import { OrderStatusHistoryRepository } from '../repositories/order-status-history.repository';
import { RedisCacheService } from '../cache/redis-cache.service';
import { KafkaEventPublisherService } from '../events/kafka-event-publisher.service';
import { RedisModule } from './redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderEntity, OrderItemEntity, OrderStatusHistoryEntity]),
    RedisModule,
  ],
  controllers: [OrderController],
  providers: [
    OrderService,
    OrderRepository,
    OrderItemRepository,
    OrderStatusHistoryRepository,
    RedisCacheService,
    KafkaEventPublisherService,
    {
      provide: 'IOrderRepository',
      useClass: OrderRepository,
    },
    {
      provide: 'IOrderItemRepository',
      useClass: OrderItemRepository,
    },
    {
      provide: 'IOrderStatusHistoryRepository',
      useClass: OrderStatusHistoryRepository,
    },
    {
      provide: 'ICacheService',
      useClass: RedisCacheService,
    },
    {
      provide: 'IEventPublisher',
      useClass: KafkaEventPublisherService,
    },
  ],
  exports: [OrderService],
})
export class OrderModule {}
