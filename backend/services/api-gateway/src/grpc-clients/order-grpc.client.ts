import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { GrpcClient, GRPC_SERVICES } from './grpc.config';

@Injectable()
export class OrderGrpcClient implements OnModuleInit {
  private readonly logger = new Logger(OrderGrpcClient.name);
  private client: GrpcClient;

  onModuleInit() {
    this.client = new GrpcClient({
      protoPath: 'order.proto',
      packageName: 'order',
      serviceName: 'OrderService',
      url: GRPC_SERVICES.ORDER_SERVICE,
    });
    this.logger.log(`Connected to Order Service at ${GRPC_SERVICES.ORDER_SERVICE}`);
  }

  async createOrder(data: {
    user_id: string;
    items: any[];
    shipping_address_id?: string;
    billing_address_id?: string;
    shipping_address?: any;
    billing_address?: any;
    payment_method: string;
    total_amount?: { amount: number; currency: string };
  }): Promise<any> {
    return this.client.call('CreateOrder', data);
  }

  async getOrder(orderId: string, userId: string): Promise<any> {
    return this.client.call('GetOrder', {
      order_id: orderId,
      user_id: userId,
    });
  }

  async listOrders(data: {
    user_id: string;
    page?: number;
    page_size?: number;
    status?: string;
  }): Promise<any> {
    return this.client.call('ListOrders', data);
  }

  async cancelOrder(orderId: string, userId: string): Promise<any> {
    return this.client.call('CancelOrder', {
      order_id: orderId,
      user_id: userId,
    });
  }

  async getOrderStatus(orderId: string, userId: string): Promise<any> {
    return this.client.call('GetOrderStatus', {
      order_id: orderId,
      user_id: userId,
    });
  }

  async updateOrderStatus(data: {
    order_id: string;
    status: string;
  }): Promise<any> {
    return this.client.call('UpdateOrderStatus', data);
  }
}
