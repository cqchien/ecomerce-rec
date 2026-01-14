import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { GrpcClient, GRPC_SERVICES } from './grpc.config';

@Injectable()
export class PaymentGrpcClient implements OnModuleInit {
  private readonly logger = new Logger(PaymentGrpcClient.name);
  private client: GrpcClient;

  onModuleInit() {
    this.client = new GrpcClient({
      protoPath: 'payment.proto',
      packageName: 'payment',
      serviceName: 'PaymentService',
      url: GRPC_SERVICES.PAYMENT_SERVICE,
    });
    this.logger.log(`Connected to Payment Service at ${GRPC_SERVICES.PAYMENT_SERVICE}`);
  }

  async createPaymentIntent(data: {
    user_id: string;
    order_id: string;
    amount: { amount: number; currency: string };
    payment_method: string;
  }): Promise<any> {
    return this.client.call('CreatePaymentIntent', data);
  }

  async confirmPayment(data: {
    payment_id: string;
    payment_method: string;
    metadata?: Record<string, string>;
  }): Promise<any> {
    return this.client.call('ConfirmPayment', data);
  }

  async getPaymentStatus(paymentId: string): Promise<any> {
    return this.client.call('GetPaymentStatus', { payment_id: paymentId });
  }

  async refundPayment(data: {
    payment_id: string;
    amount?: { amount: number; currency: string };
    reason?: string;
  }): Promise<any> {
    return this.client.call('RefundPayment', data);
  }

  async listPayments(data: {
    user_id?: string;
    order_id?: string;
    page?: number;
    page_size?: number;
  }): Promise<any> {
    return this.client.call('ListPayments', data);
  }
}
