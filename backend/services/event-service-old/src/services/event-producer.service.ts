import { Injectable, OnModuleInit, OnModuleDestroy, Logger, Inject } from '@nestjs/common';
import { Kafka, Producer, ProducerRecord, RecordMetadata, CompressionTypes } from 'kafkajs';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { EventPayload, EventMetadata } from '../interfaces/event.interface';
import {
  KAFKA_CONFIG,
  PRODUCER_CONFIG,
  ERROR_MESSAGES,
  EVENT_SCHEMA_VERSION,
  EventPriority,
  CACHE_KEYS,
  CACHE_TTL,
} from '../common/constants';

@Injectable()
export class EventProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventProducerService.name);
  private kafka: Kafka;
  private producer: Producer;

  constructor(
    @Inject('REDIS_CLIENT')
    private readonly redisClient: Redis,
  ) {
    this.kafka = new Kafka({
      clientId: KAFKA_CONFIG.CLIENT_ID,
      brokers: KAFKA_CONFIG.BROKERS,
      connectionTimeout: KAFKA_CONFIG.CONNECTION_TIMEOUT,
      requestTimeout: KAFKA_CONFIG.REQUEST_TIMEOUT,
      retry: {
        retries: KAFKA_CONFIG.RETRY.RETRIES,
        initialRetryTime: KAFKA_CONFIG.RETRY.INITIAL_RETRY_TIME,
        maxRetryTime: KAFKA_CONFIG.RETRY.MAX_RETRY_TIME,
      },
      logLevel: KAFKA_CONFIG.LOG_LEVEL,
    });

    this.producer = this.kafka.producer({
      allowAutoTopicCreation: PRODUCER_CONFIG.ALLOW_AUTO_TOPIC_CREATION,
      transactionTimeout: PRODUCER_CONFIG.TRANSACTION_TIMEOUT,
      maxInFlightRequests: PRODUCER_CONFIG.MAX_IN_FLIGHT_REQUESTS,
      idempotent: PRODUCER_CONFIG.IDEMPOTENT,
    });
  }

  async onModuleInit() {
    try {
      await this.producer.connect();
      this.logger.log('Kafka producer connected successfully');
    } catch (error) {
      this.logger.error(`Failed to connect Kafka producer: ${error.message}`);
      throw new Error(ERROR_MESSAGES.PRODUCER_INIT_FAILED);
    }
  }

  async onModuleDestroy() {
    try {
      await this.producer.disconnect();
      this.logger.log('Kafka producer disconnected');
    } catch (error) {
      this.logger.error(`Error disconnecting producer: ${error.message}`);
    }
  }

  /**
   * Publish event to Kafka topic
   */
  async publishEvent<T>(
    topic: string,
    data: T,
    options?: {
      priority?: EventPriority;
      source?: string;
      correlationId?: string;
      userId?: string;
      key?: string;
    },
  ): Promise<RecordMetadata[]> {
    const eventId = uuidv4();
    
    const metadata: EventMetadata = {
      eventId,
      eventType: topic,
      timestamp: new Date(),
      version: EVENT_SCHEMA_VERSION,
      priority: options?.priority || EventPriority.MEDIUM,
      source: options?.source || 'event-service',
      correlationId: options?.correlationId,
      userId: options?.userId,
    };

    const eventPayload: EventPayload<T> = {
      metadata,
      data,
    };

    try {
      const record: ProducerRecord = {
        topic,
        messages: [
          {
            key: options?.key || eventId,
            value: JSON.stringify(eventPayload),
            headers: {
              eventId,
              eventType: topic,
              priority: metadata.priority,
              timestamp: metadata.timestamp.toISOString(),
            },
          },
        ],
        compression: CompressionTypes.GZIP,
      };

      const result = await this.producer.send(record);

      // Cache processed event
      await this.cacheEvent(eventId, eventPayload);

      this.logger.log(`Event published successfully: ${topic} (${eventId})`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to publish event to ${topic}: ${error.message}`);
      throw new Error(ERROR_MESSAGES.MESSAGE_SEND_FAILED);
    }
  }

  /**
   * Publish batch of events
   */
  async publishBatch<T>(
    topic: string,
    events: Array<{ data: T; key?: string }>,
  ): Promise<RecordMetadata[]> {
    try {
      const messages = events.map(event => {
        const eventId = uuidv4();
        const metadata: EventMetadata = {
          eventId,
          eventType: topic,
          timestamp: new Date(),
          version: EVENT_SCHEMA_VERSION,
          priority: EventPriority.MEDIUM,
          source: 'event-service',
        };

        const eventPayload: EventPayload<T> = {
          metadata,
          data: event.data,
        };

        return {
          key: event.key || eventId,
          value: JSON.stringify(eventPayload),
          headers: {
            eventId,
            eventType: topic,
            timestamp: metadata.timestamp.toISOString(),
          },
        };
      });

      const record: ProducerRecord = {
        topic,
        messages,
        compression: CompressionTypes.GZIP,
      };

      const result = await this.producer.send(record);
      this.logger.log(`Batch published successfully: ${topic} (${messages.length} events)`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to publish batch to ${topic}: ${error.message}`);
      throw new Error(ERROR_MESSAGES.MESSAGE_SEND_FAILED);
    }
  }

  /**
   * Cache event for deduplication
   */
  private async cacheEvent(eventId: string, payload: EventPayload): Promise<void> {
    try {
      const cacheKey = `${CACHE_KEYS.EVENT_PROCESSED}${eventId}`;
      await this.redisClient.setex(
        cacheKey,
        CACHE_TTL.EVENT_PROCESSED,
        JSON.stringify(payload.metadata),
      );
    } catch (error) {
      this.logger.warn(`Failed to cache event ${eventId}: ${error.message}`);
    }
  }

  /**
   * Check if event was already processed
   */
  async isEventProcessed(eventId: string): Promise<boolean> {
    try {
      const cacheKey = `${CACHE_KEYS.EVENT_PROCESSED}${eventId}`;
      const cached = await this.redisClient.get(cacheKey);
      return !!cached;
    } catch (error) {
      this.logger.warn(`Failed to check event cache: ${error.message}`);
      return false;
    }
  }
}
