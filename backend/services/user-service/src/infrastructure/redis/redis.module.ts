import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [
    {
      provide: 'ICacheService',
      useClass: RedisService,
    },
    RedisService,
  ],
  exports: ['ICacheService', RedisService],
})
export class RedisModule {}
