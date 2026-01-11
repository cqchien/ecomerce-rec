import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';
import { IEventPublisher } from '../../domain/interfaces/event-publisher.interface';

/**
 * Kafka Event Publisher Service (Infrastructure Layer)
 * Implements IEventPublisher using KafkaJS
 */
@Injectable()
export class KafkaEventPublisherService implements IEventPublisher, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaEventPublisherService.name);
  private kafka: Kafka;
  private producer: Producer;

  constructor(private readonly configService: ConfigService) {
    this.kafka = new Kafka({
      clientId: 'cart-service',
      brokers: this.configService.get<string>('KAFKA_BROKERS', 'localhost:9092').split(','),
    });
    this.producer = this.kafka.producer();
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
        messages: [
          {
            key: event.userId || event.cartId || event.id || Date.now().toString(),
            value: JSON.stringify(event),
            timestamp: Date.now().toString(),
          },
        ],
      });
      this.logger.debug(`Event published to ${topic}:`, event);
    } catch (error) {
      this.logger.error(`Failed to publish event to ${topic}`, error);
      throw error;
    }
  }

  async publishBatch(events: Array<{ topic: string; event: any }>): Promise<void> {
    try {
      const topicMessages = events.reduce((acc, { topic, event }) => {
        if (!acc[topic]) {
          acc[topic] = [];
        }
        acc[topic].push({
          key: event.userId || event.cartId || event.id || Date.now().toString(),
          value: JSON.stringify(event),
          timestamp: Date.now().toString(),
        });
        return acc;
      }, {} as Record<string, any[]>);

      await Promise.all(
        Object.entries(topicMessages).map(([topic, messages]) =>
          this.producer.send({ topic, messages }),
        ),
      );

      this.logger.debug(`Batch of ${events.length} events published`);
    } catch (error) {
      this.logger.error('Failed to publish batch events', error);
      throw error;
    }
  }
}
