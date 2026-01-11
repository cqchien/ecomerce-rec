import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { ICacheService } from '../../domain/interfaces/cache.interface';

/**
 * Redis Cache Service (Infrastructure Layer)
 * Implements ICacheService using Redis
 */
@Injectable()
export class RedisCacheService implements ICacheService {
  constructor(private readonly redisService: RedisService) {}

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redisService.get(key);
    if (!value) {
      return null;
    }
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as T;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    await this.redisService.set(key, serialized, ttl);
  }

  async del(key: string): Promise<void> {
    await this.redisService.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const value = await this.redisService.get(key);
    return value !== null;
  }
}
