import { Injectable, OnModuleInit, OnModuleDestroy, Logger, Inject } from '@nestjs/common';
import { Kafka, Consumer, EachMessagePayload, KafkaMessage } from 'kafkajs';
import Redis from 'ioredis';
import { EventPayload } from '../interfaces/event.interface';
import {
  KAFKA_CONFIG,
  CONSUMER_CONFIG,
  RETRY_CONFIG,
  CACHE_KEYS,
  CACHE_TTL,
  DLQ_CONFIG,
  ERROR_MESSAGES,
  EventStatus,
} from '../common/constants';

@Injectable()
export class EventConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventConsumerService.name);
  private kafka: Kafka;
  private consumers: Map<string, Consumer> = new Map();
  private eventHandlers: Map<string, (payload: EventPayload) => Promise<void>> = new Map();

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
  }

  async onModuleInit() {
    this.logger.log('Event Consumer Service initialized');
  }

  async onModuleDestroy() {
    for (const [groupId, consumer] of this.consumers.entries()) {
      try {
        await consumer.disconnect();
        this.logger.log(`Consumer ${groupId} disconnected`);
      } catch (error) {
        this.logger.error(`Error disconnecting consumer ${groupId}: ${error.message}`);
      }
    }
  }

  /**
   * Register event handler
   */
  registerHandler(topic: string, handler: (payload: EventPayload) => Promise<void>) {
    this.eventHandlers.set(topic, handler);
    this.logger.log(`Handler registered for topic: ${topic}`);
  }

  /**
   * Subscribe to topics
   */
  async subscribe(topics: string[], groupId: string): Promise<void> {
    if (this.consumers.has(groupId)) {
      this.logger.warn(`Consumer group ${groupId} already exists`);
      return;
    }

    const consumer = this.kafka.consumer({
      groupId,
      sessionTimeout: CONSUMER_CONFIG.SESSION_TIMEOUT,
      heartbeatInterval: CONSUMER_CONFIG.HEARTBEAT_INTERVAL,
      rebalanceTimeout: CONSUMER_CONFIG.REBALANCE_TIMEOUT,
      maxBytesPerPartition: CONSUMER_CONFIG.MAX_BYTES_PER_PARTITION,
    });

    try {
      await consumer.connect();
      this.logger.log(`Consumer connected: ${groupId}`);

      await consumer.subscribe({
        topics,
        fromBeginning: CONSUMER_CONFIG.FROM_BEGINNING,
      });

      await consumer.run({
        autoCommit: CONSUMER_CONFIG.AUTO_COMMIT,
        eachMessage: async (payload: EachMessagePayload) => {
          await this.handleMessage(payload, consumer);
        },
      });

      this.consumers.set(groupId, consumer);
      this.logger.log(`Subscribed to topics: ${topics.join(', ')} (group: ${groupId})`);
    } catch (error) {
      this.logger.error(`Failed to subscribe consumer ${groupId}: ${error.message}`);
      throw new Error(ERROR_MESSAGES.CONSUMER_INIT_FAILED);
    }
  }

  /**
   * Handle incoming message
   */
  private async handleMessage(payload: EachMessagePayload, consumer: Consumer): Promise<void> {
    const { topic, partition, message } = payload;
    const eventId = message.headers?.eventId?.toString() || 'unknown';

    try {
      // Check if event was already processed (deduplication)
      const isProcessed = await this.isEventProcessed(eventId);
      if (isProcessed) {
        this.logger.debug(`Event ${eventId} already processed, skipping`);
        await consumer.commitOffsets([
          {
            topic,
            partition,
            offset: (parseInt(message.offset) + 1).toString(),
          },
        ]);
        return;
      }

      // Parse event payload
      const eventPayload: EventPayload = JSON.parse(message.value?.toString() || '{}');

      // Mark as processing
      await this.markEventStatus(eventId, EventStatus.PROCESSING);

      // Get handler for topic
      const handler = this.eventHandlers.get(topic);
      if (!handler) {
        this.logger.warn(`No handler registered for topic: ${topic}`);
        await consumer.commitOffsets([
          {
            topic,
            partition,
            offset: (parseInt(message.offset) + 1).toString(),
          },
        ]);
        return;
      }

      // Execute handler
      await this.executeWithRetry(handler, eventPayload, eventId);

      // Mark as processed
      await this.markEventProcessed(eventId);

      // Commit offset
      await consumer.commitOffsets([
        {
          topic,
          partition,
          offset: (parseInt(message.offset) + 1).toString(),
        },
      ]);

      this.logger.log(`Event processed successfully: ${topic} (${eventId})`);
    } catch (error) {
      this.logger.error(`Failed to process event ${eventId}: ${error.message}`);
      await this.handleFailedEvent(topic, message, eventId, error);
    }
  }

  /**
   * Execute handler with retry logic
   */
  private async executeWithRetry(
    handler: (payload: EventPayload) => Promise<void>,
    payload: EventPayload,
    eventId: string,
  ): Promise<void> {
    let retries = 0;
    let delay = RETRY_CONFIG.RETRY_DELAY;

    while (retries < RETRY_CONFIG.MAX_RETRIES) {
      try {
        await handler(payload);
        return;
      } catch (error) {
        retries++;
        if (retries >= RETRY_CONFIG.MAX_RETRIES) {
          throw error;
        }

        this.logger.warn(
          `Retry ${retries}/${RETRY_CONFIG.MAX_RETRIES} for event ${eventId}: ${error.message}`,
        );

        await this.markEventStatus(eventId, EventStatus.RETRYING, retries);
        await this.sleep(delay);
        delay = Math.min(delay * RETRY_CONFIG.BACKOFF_MULTIPLIER, RETRY_CONFIG.MAX_RETRY_DELAY);
      }
    }
  }

  /**
   * Handle failed event (send to DLQ)
   */
  private async handleFailedEvent(
    topic: string,
    message: KafkaMessage,
    eventId: string,
    error: Error,
  ): Promise<void> {
    try {
      const dlqTopic = `${topic}${DLQ_CONFIG.TOPIC_SUFFIX}`;
      
      await this.markEventStatus(eventId, EventStatus.FAILED);
      await this.cacheFailedEvent(eventId, { topic, message, error: error.message });

      this.logger.error(`Event sent to DLQ: ${dlqTopic} (${eventId})`);
    } catch (dlqError) {
      this.logger.error(`Failed to send event to DLQ: ${dlqError.message}`);
    }
  }

  /**
   * Mark event as processed
   */
  private async markEventProcessed(eventId: string): Promise<void> {
    try {
      const cacheKey = `${CACHE_KEYS.EVENT_PROCESSED}${eventId}`;
      await this.redisClient.setex(cacheKey, CACHE_TTL.EVENT_PROCESSED, Date.now().toString());
    } catch (error) {
      this.logger.warn(`Failed to mark event as processed: ${error.message}`);
    }
  }

  /**
   * Check if event was processed
   */
  private async isEventProcessed(eventId: string): Promise<boolean> {
    try {
      const cacheKey = `${CACHE_KEYS.EVENT_PROCESSED}${eventId}`;
      const result = await this.redisClient.get(cacheKey);
      return !!result;
    } catch (error) {
      this.logger.warn(`Failed to check event processed status: ${error.message}`);
      return false;
    }
  }

  /**
   * Mark event status
   */
  private async markEventStatus(
    eventId: string,
    status: EventStatus,
    retryCount?: number,
  ): Promise<void> {
    try {
      const statusData = {
        status,
        timestamp: new Date().toISOString(),
        retryCount: retryCount || 0,
      };
      await this.redisClient.setex(
        `event:status:${eventId}`,
        CACHE_TTL.EVENT_PROCESSED,
        JSON.stringify(statusData),
      );
    } catch (error) {
      this.logger.warn(`Failed to mark event status: ${error.message}`);
    }
  }

  /**
   * Cache failed event
   */
  private async cacheFailedEvent(eventId: string, data: any): Promise<void> {
    try {
      const cacheKey = `${CACHE_KEYS.FAILED_EVENT}${eventId}`;
      await this.redisClient.setex(cacheKey, CACHE_TTL.FAILED_EVENT, JSON.stringify(data));
    } catch (error) {
      this.logger.warn(`Failed to cache failed event: ${error.message}`);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
