import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, timeout, catchError } from 'rxjs';
import { AxiosError } from 'axios';
import { SERVICE_URLS, TIMEOUT } from '../common/constants';

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);

  constructor(private readonly httpService: HttpService) {}

  /**
   * Forward request to target service
   */
  async forwardRequest(
    serviceUrl: string,
    path: string,
    method: string,
    body?: any,
    headers?: any,
    queryParams?: any,
    requestTimeout: number = TIMEOUT.DEFAULT_REQUEST,
  ): Promise<any> {
    const url = `${serviceUrl}${path}`;
    
    this.logger.debug(`Forwarding ${method} request to ${url}`);

    try {
      const config = {
        method: method.toLowerCase(),
        url,
        data: body,
        headers: this.sanitizeHeaders(headers),
        params: queryParams,
      };

      const response = await firstValueFrom(
        this.httpService.request(config).pipe(
          timeout(requestTimeout),
          catchError((error: AxiosError) => {
            throw error;
          }),
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error(`Request to ${url} failed: ${error.message}`);
      throw this.handleProxyError(error);
    }
  }

  /**
   * Forward to Product Service
   */
  async forwardToProductService(path: string, method: string, body?: any, headers?: any, query?: any) {
    // Note: Product service is gRPC, this would need gRPC client in production
    // For now, using HTTP endpoint if available
    return this.forwardRequest(SERVICE_URLS.PRODUCT_SERVICE, path, method, body, headers, query);
  }

  /**
   * Forward to Inventory Service
   */
  async forwardToInventoryService(path: string, method: string, body?: any, headers?: any, query?: any) {
    return this.forwardRequest(SERVICE_URLS.INVENTORY_SERVICE, path, method, body, headers, query);
  }

  /**
   * Forward to User Service
   */
  async forwardToUserService(path: string, method: string, body?: any, headers?: any, query?: any) {
    return this.forwardRequest(SERVICE_URLS.USER_SERVICE, `/api${path}`, method, body, headers, query);
  }

  /**
   * Forward to Cart Service
   */
  async forwardToCartService(path: string, method: string, body?: any, headers?: any, query?: any) {
    return this.forwardRequest(SERVICE_URLS.CART_SERVICE, `/api${path}`, method, body, headers, query);
  }

  /**
   * Forward to Order Service
   */
  async forwardToOrderService(path: string, method: string, body?: any, headers?: any, query?: any) {
    return this.forwardRequest(SERVICE_URLS.ORDER_SERVICE, `/api${path}`, method, body, headers, query);
  }

  /**
   * Forward to Payment Service
   */
  async forwardToPaymentService(path: string, method: string, body?: any, headers?: any, query?: any) {
    return this.forwardRequest(
      SERVICE_URLS.PAYMENT_SERVICE,
      `/api${path}`,
      method,
      body,
      headers,
      query,
      TIMEOUT.PAYMENT_REQUEST,
    );
  }

  /**
   * Sanitize headers (remove sensitive info)
   */
  private sanitizeHeaders(headers: any): any {
    if (!headers) return {};

    const sanitized = { ...headers };
    
    // Remove headers that shouldn't be forwarded
    delete sanitized['host'];
    delete sanitized['connection'];
    delete sanitized['content-length'];
    
    return sanitized;
  }

  /**
   * Handle proxy errors
   */
  private handleProxyError(error: any): any {
    if (error.response) {
      // Service responded with error
      const { status, data } = error.response;
      const errorResponse = new Error(data?.message || 'Service error');
      (errorResponse as any).status = status;
      (errorResponse as any).response = data;
      return errorResponse;
    } else if (error.code === 'ECONNREFUSED') {
      // Service unavailable
      const errorResponse = new Error('Service unavailable');
      (errorResponse as any).status = 503;
      return errorResponse;
    } else if (error.name === 'TimeoutError') {
      // Request timeout
      const errorResponse = new Error('Gateway timeout');
      (errorResponse as any).status = 504;
      return errorResponse;
    }
    
    return error;
  }
}
