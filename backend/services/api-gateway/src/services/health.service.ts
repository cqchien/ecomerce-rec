import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, timeout, catchError, of } from 'rxjs';
import { SERVICE_URLS, HEALTH_CHECK } from '../common/constants';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly httpService: HttpService) {}

  async checkAllServices() {
    const services = [
      { name: 'user-service', url: `${SERVICE_URLS.USER_SERVICE}/api/health` },
      { name: 'cart-service', url: `${SERVICE_URLS.CART_SERVICE}/api/health` },
      { name: 'order-service', url: `${SERVICE_URLS.ORDER_SERVICE}/api/health` },
      { name: 'payment-service', url: `${SERVICE_URLS.PAYMENT_SERVICE}/api/health` },
    ];

    const checks = await Promise.all(
      services.map(service => this.checkService(service.name, service.url)),
    );

    const healthMap: Record<string, any> = {};
    checks.forEach(check => {
      healthMap[check.name] = check;
    });

    return healthMap;
  }

  private async checkService(name: string, url: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(url).pipe(
          timeout(HEALTH_CHECK.TIMEOUT_MS),
          catchError(error => {
            this.logger.error(`Health check failed for ${name}: ${error.message}`);
            return of(null);
          }),
        ),
      );

      if (response && response.data) {
        return {
          name,
          status: 'healthy',
          responseTime: response.headers['x-response-time'] || 'N/A',
        };
      }

      return {
        name,
        status: 'unhealthy',
        error: 'No response',
      };
    } catch (error) {
      return {
        name,
        status: 'unhealthy',
        error: error.message,
      };
    }
  }
}
