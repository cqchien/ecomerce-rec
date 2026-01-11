import { Controller, Get, Post, Put, Delete, Body, Param, Query, ValidationPipe } from '@nestjs/common';
import { NotificationService } from '../services/notification.service';
import { NotificationSenderService } from '../services/notification-sender.service';

@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly senderService: NotificationSenderService,
  ) {}

  @Get()
  async getUserNotifications(
    @Query('userId') userId: string,
    @Query('limit') limit: number = 20,
    @Query('offset') offset: number = 0,
  ) {
    const [notifications, total] = await this.notificationService.getUserNotifications(
      userId,
      limit,
      offset,
    );

    return {
      success: true,
      data: {
        notifications,
        total,
        limit,
        offset,
      },
    };
  }

  @Get('stats')
  async getStats(@Query('userId') userId?: string) {
    const stats = await this.notificationService.getNotificationStats(userId);

    return {
      success: true,
      data: stats,
    };
  }

  @Post('send')
  async sendNotification(
    @Body(ValidationPipe)
    body: {
      userId: string;
      type: string;
      channel: string;
      template: string;
      data: Record<string, any>;
      priority?: string;
      recipient?: string;
    },
  ) {
    const notificationId = await this.senderService.sendNotification(body);

    return {
      success: true,
      data: {
        notificationId,
      },
      message: 'Notification queued successfully',
    };
  }

  @Post('retry-failed')
  async retryFailed(@Query('limit') limit: number = 100) {
    await this.senderService.retryFailedNotifications(limit);

    return {
      success: true,
      message: 'Retry process initiated',
    };
  }

  @Delete(':id')
  async deleteNotification(@Param('id') id: string) {
    await this.notificationService.deleteNotification(id);

    return {
      success: true,
      message: 'Notification deleted successfully',
    };
  }
}
