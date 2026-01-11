import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, CompressionTypes } from 'kafkajs';
import { IEventPublisher } from '../../domain/interfaces/event.interface';

@Injectable()
export class KafkaEventPublisherService implements IEventPublisher, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaEventPublisherService.name);
  private kafka: Kafka;
  private producer: Producer;

  constructor(private readonly configService: ConfigService) {
    const brokers = this.configService.get<string>('KAFKA_BROKERS')?.split(',') || ['localhost:9092'];
    
    this.kafka = new Kafka({
      clientId: this.configService.get<string>('KAFKA_CLIENT_ID') || 'payment-service',
      brokers,
      retry: {
        retries: 3,
        initialRetryTime: 300,
        factor: 2,
      },
    });

    this.producer = this.kafka.producer({
      allowAutoTopicCreation: true,
      transactionTimeout: 30000,
    });
  }

  async onModuleInit() {
    try {
      await this.producer.connect();
      this.logger.log('Kafka producer connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect Kafka producer', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.producer.disconnect();
      this.logger.log('Kafka producer disconnected');
    } catch (error) {
      this.logger.error('Error disconnecting Kafka producer', error);
    }
  }

  async publish(topic: string, event: any): Promise<void> {
    try {
      await this.producer.send({
        topic,
        compression: CompressionTypes.GZIP,
        messages: [
          {
            key: event.id || event.paymentId || Date.now().toString(),
            value: JSON.stringify(event),
            timestamp: Date.now().toString(),
          },
        ],
      });

      this.logger.log(`Event published to topic: ${topic}`);
    } catch (error) {
      this.logger.error(`Failed to publish event to topic: ${topic}`, error);
      throw error;
    }
  }

  async publishBatch(topic: string, events: any[]): Promise<void> {
    try {
      const messages = events.map((event) => ({
        key: event.id || event.paymentId || Date.now().toString(),
        value: JSON.stringify(event),
        timestamp: Date.now().toString(),
      }));

      await this.producer.send({
        topic,
        compression: CompressionTypes.GZIP,
        messages,
      });

      this.logger.log(`Batch of ${events.length} events published to topic: ${topic}`);
    } catch (error) {
      this.logger.error(`Failed to publish batch events to topic: ${topic}`, error);
      throw error;
    }
  }
}
