import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from '../../domain/entities/payment.entity';
import { Refund } from '../../domain/entities/refund.entity';
import { PaymentService } from '../../application/services/payment.service';
import { PaymentController } from '../../presentation/controllers/payment.controller';
import { PaymentRepository } from '../repositories/payment.repository';
import { RedisCacheService } from '../cache/redis-cache.service';
import { KafkaEventPublisherService } from '../events/kafka-event-publisher.service';
import { RedisModule } from './redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Refund]),
    RedisModule,
  ],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    {
      provide: 'IPaymentRepository',
      useClass: PaymentRepository,
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
  exports: [PaymentService],
})
export class PaymentModule {}
