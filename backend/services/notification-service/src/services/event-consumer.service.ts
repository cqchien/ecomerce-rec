import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { NotificationSenderService } from './notification-sender.service';
import { KAFKA_TOPICS, KAFKA_CONSUMER_GROUP, EMAIL_TEMPLATES, SMS_TEMPLATES } from '../common/constants';
import Redis from 'ioredis';

@Injectable()
export class EventConsumerService implements OnModuleInit {
  private kafka: Kafka;
  private consumer: Consumer;
  private eventHandlers: Map<string, (data: any, metadata: any) => Promise<void>> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly notificationSender: NotificationSenderService,
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
  ) {
    const brokers = this.configService.get<string>('KAFKA_BROKERS', 'localhost:9092').split(',');

    this.kafka = new Kafka({
      clientId: this.configService.get<string>('KAFKA_CLIENT_ID', 'notification-service'),
      brokers,
    });

    this.consumer = this.kafka.consumer({
      groupId: this.configService.get<string>('KAFKA_GROUP_ID', KAFKA_CONSUMER_GROUP),
    });

    this.registerHandlers();
  }

  async onModuleInit() {
    await this.consumer.connect();
    console.log('Kafka consumer connected');

    // Subscribe to all relevant topics
    const topics = Object.values(KAFKA_TOPICS);
    await this.consumer.subscribe({ topics, fromBeginning: false });
    console.log(`Subscribed to topics: ${topics.join(', ')}`);

    await this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        await this.handleMessage(payload);
      },
    });
  }

  private registerHandlers() {
    // Order Event Handlers
    this.eventHandlers.set(KAFKA_TOPICS.ORDER_CREATED, this.handleOrderCreated.bind(this));
    this.eventHandlers.set(KAFKA_TOPICS.ORDER_CONFIRMED, this.handleOrderConfirmed.bind(this));
    this.eventHandlers.set(KAFKA_TOPICS.ORDER_SHIPPED, this.handleOrderShipped.bind(this));
    this.eventHandlers.set(KAFKA_TOPICS.ORDER_DELIVERED, this.handleOrderDelivered.bind(this));
    this.eventHandlers.set(KAFKA_TOPICS.ORDER_CANCELLED, this.handleOrderCancelled.bind(this));

    // Payment Event Handlers
    this.eventHandlers.set(KAFKA_TOPICS.PAYMENT_SUCCEEDED, this.handlePaymentSucceeded.bind(this));
    this.eventHandlers.set(KAFKA_TOPICS.PAYMENT_FAILED, this.handlePaymentFailed.bind(this));
    this.eventHandlers.set(KAFKA_TOPICS.PAYMENT_REFUNDED, this.handlePaymentRefunded.bind(this));

    // User Event Handlers
    this.eventHandlers.set(KAFKA_TOPICS.USER_REGISTERED, this.handleUserRegistered.bind(this));
    this.eventHandlers.set(KAFKA_TOPICS.PASSWORD_RESET_REQUESTED, this.handlePasswordResetRequested.bind(this));

    // Cart Event Handlers
    this.eventHandlers.set(KAFKA_TOPICS.CART_ABANDONED, this.handleCartAbandoned.bind(this));

    // Inventory Event Handlers
    this.eventHandlers.set(KAFKA_TOPICS.INVENTORY_LOW_STOCK, this.handleLowStock.bind(this));

    // Product Event Handlers
    this.eventHandlers.set(KAFKA_TOPICS.PRODUCT_PRICE_CHANGED, this.handlePriceChanged.bind(this));
  }

  private async handleMessage(payload: EachMessagePayload) {
    const { topic, partition, message } = payload;

    try {
      const value = message.value?.toString();
      if (!value) return;

      const event = JSON.parse(value);
      const { metadata, data } = event;

      console.log(`Processing event: ${metadata.eventType} (${metadata.eventId})`);

      const handler = this.eventHandlers.get(topic);
      if (handler) {
        await handler(data, metadata);
      } else {
        console.warn(`No handler registered for topic: ${topic}`);
      }
    } catch (error) {
      console.error(`Error processing message from ${topic}:`, error);
    }
  }

  // Order Event Handlers
  private async handleOrderCreated(data: any, metadata: any) {
    await this.notificationSender.sendNotification({
      userId: data.userId,
      type: 'email',
      channel: 'order',
      template: EMAIL_TEMPLATES.ORDER_CONFIRMATION,
      data: {
        orderId: data.orderId,
        orderNumber: data.orderNumber,
        totalAmount: data.totalAmount,
        items: data.items,
        shippingAddress: data.shippingAddress,
      },
      priority: 'high',
    });

    await this.notificationSender.sendNotification({
      userId: data.userId,
      type: 'sms',
      channel: 'order',
      template: SMS_TEMPLATES.ORDER_CONFIRMATION,
      data: {
        orderId: data.orderId,
        totalAmount: data.totalAmount,
      },
      priority: 'high',
    });
  }

  private async handleOrderConfirmed(data: any, metadata: any) {
    // Order confirmation happens after payment
    console.log('Order confirmed:', data.orderId);
  }

  private async handleOrderShipped(data: any, metadata: any) {
    await this.notificationSender.sendNotification({
      userId: data.userId,
      type: 'email',
      channel: 'order',
      template: EMAIL_TEMPLATES.ORDER_SHIPPED,
      data: {
        orderId: data.orderId,
        trackingNumber: data.trackingNumber,
        carrier: data.carrier,
        estimatedDelivery: data.estimatedDelivery,
      },
      priority: 'high',
    });

    await this.notificationSender.sendNotification({
      userId: data.userId,
      type: 'sms',
      channel: 'order',
      template: SMS_TEMPLATES.ORDER_SHIPPED,
      data: {
        orderId: data.orderId,
        trackingNumber: data.trackingNumber,
      },
      priority: 'high',
    });
  }

  private async handleOrderDelivered(data: any, metadata: any) {
    await this.notificationSender.sendNotification({
      userId: data.userId,
      type: 'email',
      channel: 'order',
      template: EMAIL_TEMPLATES.ORDER_DELIVERED,
      data: {
        orderId: data.orderId,
        deliveredAt: data.deliveredAt,
      },
      priority: 'normal',
    });
  }

  private async handleOrderCancelled(data: any, metadata: any) {
    await this.notificationSender.sendNotification({
      userId: data.userId,
      type: 'email',
      channel: 'order',
      template: EMAIL_TEMPLATES.ORDER_CANCELLED,
      data: {
        orderId: data.orderId,
        reason: data.reason,
        refundAmount: data.refundAmount,
      },
      priority: 'high',
    });
  }

  // Payment Event Handlers
  private async handlePaymentSucceeded(data: any, metadata: any) {
    await this.notificationSender.sendNotification({
      userId: data.userId,
      type: 'email',
      channel: 'payment',
      template: EMAIL_TEMPLATES.PAYMENT_SUCCESS,
      data: {
        orderId: data.orderId,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        transactionId: data.transactionId,
      },
      priority: 'high',
    });
  }

  private async handlePaymentFailed(data: any, metadata: any) {
    await this.notificationSender.sendNotification({
      userId: data.userId,
      type: 'email',
      channel: 'payment',
      template: EMAIL_TEMPLATES.PAYMENT_FAILED,
      data: {
        orderId: data.orderId,
        amount: data.amount,
        reason: data.reason,
      },
      priority: 'critical',
    });
  }

  private async handlePaymentRefunded(data: any, metadata: any) {
    await this.notificationSender.sendNotification({
      userId: data.userId,
      type: 'email',
      channel: 'payment',
      template: EMAIL_TEMPLATES.REFUND_PROCESSED,
      data: {
        orderId: data.orderId,
        refundAmount: data.refundAmount,
        reason: data.reason,
      },
      priority: 'high',
    });
  }

  // User Event Handlers
  private async handleUserRegistered(data: any, metadata: any) {
    await this.notificationSender.sendNotification({
      userId: data.userId,
      type: 'email',
      channel: 'user',
      template: EMAIL_TEMPLATES.WELCOME,
      data: {
        name: data.name,
        email: data.email,
      },
      priority: 'normal',
    });
  }

  private async handlePasswordResetRequested(data: any, metadata: any) {
    await this.notificationSender.sendNotification({
      userId: data.userId,
      type: 'email',
      channel: 'user',
      template: EMAIL_TEMPLATES.PASSWORD_RESET,
      data: {
        resetToken: data.resetToken,
        resetLink: data.resetLink,
        expiresAt: data.expiresAt,
      },
      priority: 'high',
    });
  }

  // Cart Event Handlers
  private async handleCartAbandoned(data: any, metadata: any) {
    // Wait 1 hour before sending reminder
    setTimeout(async () => {
      await this.notificationSender.sendNotification({
        userId: data.userId,
        type: 'email',
        channel: 'cart',
        template: EMAIL_TEMPLATES.CART_ABANDONED,
        data: {
          cartItems: data.items,
          totalAmount: data.totalAmount,
          cartUrl: data.cartUrl,
        },
        priority: 'low',
      });
    }, 3600000); // 1 hour
  }

  // Inventory Event Handlers
  private async handleLowStock(data: any, metadata: any) {
    // Send to admin/store manager
    await this.notificationSender.sendNotification({
      userId: 'admin', // System notification
      type: 'email',
      channel: 'system',
      template: EMAIL_TEMPLATES.LOW_STOCK_ALERT,
      data: {
        productId: data.productId,
        productName: data.productName,
        currentStock: data.currentStock,
        threshold: data.threshold,
      },
      priority: 'high',
    });
  }

  // Product Event Handlers
  private async handlePriceChanged(data: any, metadata: any) {
    // Notify users who have the product in wishlist
    if (data.priceDecreased) {
      await this.notificationSender.sendNotification({
        userId: data.userId, // Would be fetched from wishlist
        type: 'email',
        channel: 'product',
        template: EMAIL_TEMPLATES.PRICE_DROP_ALERT,
        data: {
          productName: data.productName,
          oldPrice: data.oldPrice,
          newPrice: data.newPrice,
          discount: data.discount,
          productUrl: data.productUrl,
        },
        priority: 'normal',
      });
    }
  }

  async onModuleDestroy() {
    await this.consumer.disconnect();
    console.log('Kafka consumer disconnected');
  }
}
