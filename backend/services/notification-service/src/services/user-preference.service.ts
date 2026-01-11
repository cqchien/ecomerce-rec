import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPreference } from '../entities/user-preference.entity';
import { USER_PREFERENCE_DEFAULTS, REDIS_KEYS, CACHE_TTL } from '../common/constants';
import Redis from 'ioredis';

@Injectable()
export class UserPreferenceService {
  constructor(
    @InjectRepository(UserPreference)
    private readonly preferenceRepository: Repository<UserPreference>,
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
  ) {}

  async getOrCreatePreference(userId: string): Promise<UserPreference> {
    // Check cache first
    const cacheKey = `${REDIS_KEYS.USER_PREFERENCES}:${userId}`;
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    // Get from database
    let preference = await this.preferenceRepository.findOne({
      where: { userId },
    });

    // Create if not exists
    if (!preference) {
      preference = this.preferenceRepository.create({
        userId,
        ...USER_PREFERENCE_DEFAULTS,
      });
      preference = await this.preferenceRepository.save(preference);
    }

    // Cache the result
    await this.redis.setex(
      cacheKey,
      CACHE_TTL.USER_PREFERENCES,
      JSON.stringify(preference),
    );

    return preference;
  }

  async updatePreference(
    userId: string,
    updates: Partial<UserPreference>,
  ): Promise<UserPreference> {
    let preference = await this.preferenceRepository.findOne({
      where: { userId },
    });

    if (!preference) {
      preference = this.preferenceRepository.create({
        userId,
        ...USER_PREFERENCE_DEFAULTS,
        ...updates,
      });
    } else {
      Object.assign(preference, updates);
    }

    preference = await this.preferenceRepository.save(preference);

    // Invalidate cache
    const cacheKey = `${REDIS_KEYS.USER_PREFERENCES}:${userId}`;
    await this.redis.del(cacheKey);

    return preference;
  }

  async canSendNotification(
    userId: string,
    type: string,
    channel: string,
  ): Promise<boolean> {
    const preference = await this.getOrCreatePreference(userId);

    // Check if notification type is enabled
    switch (type) {
      case 'email':
        if (!preference.emailEnabled) return false;
        break;
      case 'sms':
        if (!preference.smsEnabled) return false;
        break;
      case 'push':
        if (!preference.pushEnabled) return false;
        break;
    }

    // Check channel-specific preferences
    switch (channel) {
      case 'marketing':
        if (!preference.marketingEnabled) return false;
        break;
      case 'order':
        if (!preference.orderUpdates) return false;
        break;
      case 'payment':
        if (!preference.paymentUpdates) return false;
        break;
      case 'cart':
        if (!preference.cartReminders) return false;
        break;
      case 'product':
        if (!preference.productRecommendations) return false;
        break;
    }

    return true;
  }

  async addPushToken(userId: string, token: string): Promise<void> {
    const preference = await this.getOrCreatePreference(userId);
    const tokens = preference.pushTokens || [];

    if (!tokens.includes(token)) {
      tokens.push(token);
      await this.updatePreference(userId, { pushTokens: tokens });
    }
  }

  async removePushToken(userId: string, token: string): Promise<void> {
    const preference = await this.getOrCreatePreference(userId);
    const tokens = (preference.pushTokens || []).filter((t) => t !== token);
    await this.updatePreference(userId, { pushTokens: tokens });
  }
}
