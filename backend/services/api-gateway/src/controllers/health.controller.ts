import { Controller, Get } from '@nestjs/common';
import { HealthService } from '../services/health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async check() {
    const health = await this.healthService.checkAllServices();
    return {
      status: 'ok',
      service: 'api-gateway',
      timestamp: new Date().toISOString(),
      services: health,
    };
  }
}
