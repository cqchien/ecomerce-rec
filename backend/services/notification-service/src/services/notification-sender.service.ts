import { Injectable, Inject } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { UserPreferenceService } from './user-preference.service';
import { TemplateService } from './template.service';
import { EmailProvider } from '../providers/email.provider';
import { SmsProvider } from '../providers/sms.provider';
import { PushProvider } from '../providers/push.provider';
import {
  NOTIFICATION_TYPES,
  NOTIFICATION_STATUS,
  NOTIFICATION_PRIORITY,
  ERRORS,
  RETRY_CONFIG,
  RATE_LIMITS,
  REDIS_KEYS,
  CACHE_TTL,
} from '../common/constants';
import Redis from 'ioredis';

export interface SendNotificationOptions {
  userId: string;
  type: string;
  channel: string;
  template: string;
  data: Record<string, any>;
  priority?: string;
  recipient?: string;
}

@Injectable()
export class NotificationSenderService {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly userPreferenceService: UserPreferenceService,
    private readonly templateService: TemplateService,
    private readonly emailProvider: EmailProvider,
    private readonly smsProvider: SmsProvider,
    private readonly pushProvider: PushProvider,
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
  ) {}

  async sendNotification(options: SendNotificationOptions): Promise<string> {
    const { userId, type, channel, template, data, priority, recipient } = options;

    try {
      // Check user preferences
      const canSend = await this.userPreferenceService.canSendNotification(userId, type, channel);
      if (!canSend) {
        console.log(`User ${userId} opted out of ${type} notifications for ${channel}`);
        return null;
      }

      // Check rate limit
      const rateLimitKey = `${REDIS_KEYS.RATE_LIMIT}:${userId}:${type}`;
      const count = await this.redis.incr(rateLimitKey);
      if (count === 1) {
        await this.redis.expire(rateLimitKey, CACHE_TTL.RATE_LIMIT);
      }

      const rateLimit = this.getRateLimit(type);
      if (count > rateLimit) {
        console.warn(`Rate limit exceeded for user ${userId} on ${type}`);
        return null;
      }

      // Get user preference for recipient info
      const userPref = await this.userPreferenceService.getOrCreatePreference(userId);
      const actualRecipient = recipient || this.getRecipient(userPref, type);

      if (!actualRecipient) {
        throw new Error(ERRORS.INVALID_RECIPIENT);
      }

      // Render template
      const rendered = await this.templateService.renderTemplate(template, data, userPref.language);

      // Create notification record
      const notification = await this.notificationService.createNotification({
        userId,
        type,
        channel,
        template,
        recipient: actualRecipient,
        subject: rendered.subject,
        content: rendered.text,
        data,
        status: NOTIFICATION_STATUS.PENDING,
        priority: priority || NOTIFICATION_PRIORITY.NORMAL,
      });

      // Send notification asynchronously
      this.processNotification(notification.id, type, actualRecipient, rendered).catch((error) => {
        console.error(`Error processing notification ${notification.id}:`, error);
      });

      return notification.id;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  private async processNotification(
    notificationId: string,
    type: string,
    recipient: string,
    rendered: { subject: string; html: string; text: string },
  ) {
    try {
      await this.notificationService.updateNotificationStatus(
        notificationId,
        NOTIFICATION_STATUS.PROCESSING,
      );

      let result: { messageId: string; provider: string };

      switch (type) {
        case NOTIFICATION_TYPES.EMAIL:
          result = await this.emailProvider.sendEmail(
            recipient,
            rendered.subject,
            rendered.html,
            rendered.text,
          );
          break;

        case NOTIFICATION_TYPES.SMS:
          result = await this.smsProvider.sendSms(recipient, rendered.text);
          break;

        case NOTIFICATION_TYPES.PUSH:
          result = await this.pushProvider.sendPushNotification(
            recipient,
            rendered.subject,
            rendered.text,
          );
          break;

        default:
          throw new Error(ERRORS.INVALID_NOTIFICATION_TYPE);
      }

      // Update notification as sent
      await this.notificationService.updateNotificationStatus(
        notificationId,
        NOTIFICATION_STATUS.SENT,
      );

      // Update with provider info
      await this.notificationService.createNotification({
        id: notificationId,
        provider: result.provider,
        providerMessageId: result.messageId,
      } as any);

      console.log(`Notification ${notificationId} sent successfully via ${result.provider}`);
    } catch (error) {
      console.error(`Failed to send notification ${notificationId}:`, error);

      const notification = await this.notificationService.getNotificationById(notificationId);

      if (notification.retryCount < RETRY_CONFIG.MAX_RETRIES) {
        // Retry with exponential backoff
        await this.notificationService.incrementRetryCount(notificationId);
        const delay =
          RETRY_CONFIG.INITIAL_DELAY *
          Math.pow(RETRY_CONFIG.BACKOFF_MULTIPLIER, notification.retryCount);

        setTimeout(() => {
          this.processNotification(notificationId, type, recipient, rendered);
        }, Math.min(delay, RETRY_CONFIG.MAX_DELAY));
      } else {
        // Mark as failed
        await this.notificationService.updateNotificationStatus(
          notificationId,
          NOTIFICATION_STATUS.FAILED,
          error.message,
        );
      }
    }
  }

  private getRecipient(userPref: any, type: string): string {
    switch (type) {
      case NOTIFICATION_TYPES.EMAIL:
        return userPref.email;
      case NOTIFICATION_TYPES.SMS:
        return userPref.phoneNumber;
      case NOTIFICATION_TYPES.PUSH:
        return userPref.pushTokens?.[0]; // Use first token
      default:
        return null;
    }
  }

  private getRateLimit(type: string): number {
    switch (type) {
      case NOTIFICATION_TYPES.EMAIL:
        return RATE_LIMITS.EMAIL_PER_MINUTE;
      case NOTIFICATION_TYPES.SMS:
        return RATE_LIMITS.SMS_PER_MINUTE;
      case NOTIFICATION_TYPES.PUSH:
        return RATE_LIMITS.PUSH_PER_MINUTE;
      default:
        return RATE_LIMITS.PER_USER_PER_HOUR;
    }
  }

  async retryFailedNotifications(limit: number = 100): Promise<void> {
    const failedNotifications = await this.notificationService.getFailedNotifications(limit);

    for (const notification of failedNotifications) {
      if (notification.retryCount < RETRY_CONFIG.MAX_RETRIES) {
        const rendered = {
          subject: notification.subject,
          html: notification.content,
          text: notification.content,
        };

        await this.processNotification(
          notification.id,
          notification.type,
          notification.recipient,
          rendered,
        );
      }
    }
  }
}
