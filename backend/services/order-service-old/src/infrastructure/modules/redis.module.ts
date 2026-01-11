import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CONFIG } from '../../common/constants';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        const redisClient = new Redis({
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
          db: configService.get('REDIS_DB', 0),
          maxRetriesPerRequest: REDIS_CONFIG.MAX_RETRIES,
          retryStrategy: (times) => {
            if (times > REDIS_CONFIG.MAX_RETRIES) {
              return null;
            }
            return Math.min(times * REDIS_CONFIG.RETRY_DELAY, 3000);
          },
          connectTimeout: REDIS_CONFIG.CONNECT_TIMEOUT,
        });

        redisClient.on('connect', () => {
          console.log('Redis connected successfully');
        });

        redisClient.on('error', (err) => {
          console.error('Redis connection error:', err);
        });

        return redisClient;
      },
      inject: [ConfigService],
    },
  ],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}
