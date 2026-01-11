import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { NOTIFICATION_STATUS } from '../common/constants';
import Redis from 'ioredis';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
  ) {}

  async createNotification(data: Partial<Notification>): Promise<Notification> {
    const notification = this.notificationRepository.create(data);
    return this.notificationRepository.save(notification);
  }

  async getNotificationById(id: string): Promise<Notification> {
    return this.notificationRepository.findOne({ where: { id } });
  }

  async getUserNotifications(
    userId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<[Notification[], number]> {
    return this.notificationRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async updateNotificationStatus(
    id: string,
    status: string,
    error?: string,
  ): Promise<void> {
    const updateData: any = { status };

    if (status === NOTIFICATION_STATUS.SENT) {
      updateData.sentAt = new Date();
    } else if (status === NOTIFICATION_STATUS.DELIVERED) {
      updateData.deliveredAt = new Date();
    } else if (status === NOTIFICATION_STATUS.FAILED) {
      updateData.failedAt = new Date();
      if (error) {
        updateData.error = error;
      }
    }

    await this.notificationRepository.update(id, updateData);
  }

  async incrementRetryCount(id: string): Promise<void> {
    await this.notificationRepository.increment({ id }, 'retryCount', 1);
  }

  async getPendingNotifications(limit: number = 100): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { status: NOTIFICATION_STATUS.PENDING },
      order: { priority: 'DESC', createdAt: 'ASC' },
      take: limit,
    });
  }

  async getFailedNotifications(limit: number = 100): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { status: NOTIFICATION_STATUS.FAILED },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async deleteNotification(id: string): Promise<void> {
    await this.notificationRepository.delete(id);
  }

  async deleteOldNotifications(daysOld: number): Promise<number> {
    const date = new Date();
    date.setDate(date.getDate() - daysOld);

    const result = await this.notificationRepository
      .createQueryBuilder()
      .delete()
      .where('created_at < :date', { date })
      .andWhere('status IN (:...statuses)', {
        statuses: [NOTIFICATION_STATUS.SENT, NOTIFICATION_STATUS.DELIVERED],
      })
      .execute();

    return result.affected || 0;
  }

  async getNotificationStats(userId?: string): Promise<any> {
    const query = this.notificationRepository.createQueryBuilder('n');

    if (userId) {
      query.where('n.userId = :userId', { userId });
    }

    const stats = await query
      .select('n.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('n.status')
      .getRawMany();

    return stats.reduce((acc, stat) => {
      acc[stat.status] = parseInt(stat.count);
      return acc;
    }, {});
  }
}
