import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from './infrastructure/redis.module';
import { EventController } from './controllers/event.controller';
import { HealthController } from './controllers/health.controller';
import { EventProducerService } from './services/event-producer.service';
import { EventConsumerService } from './services/event-consumer.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    RedisModule,
  ],
  controllers: [EventController, HealthController],
  providers: [EventProducerService, EventConsumerService],
  exports: [EventProducerService, EventConsumerService],
})
export class AppModule {}
