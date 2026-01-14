import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { GrpcClient, GRPC_SERVICES } from './grpc.config';

@Injectable()
export class CartGrpcClient implements OnModuleInit {
  private readonly logger = new Logger(CartGrpcClient.name);
  private client: GrpcClient;

  onModuleInit() {
    this.client = new GrpcClient({
      protoPath: 'cart.proto',
      packageName: 'cart',
      serviceName: 'CartService',
      url: GRPC_SERVICES.CART_SERVICE,
    });
    this.logger.log(`Connected to Cart Service at ${GRPC_SERVICES.CART_SERVICE}`);
  }

  async getCart(userId: string): Promise<any> {
    return this.client.call('GetCart', { user_id: userId });
  }

  async addToCart(data: {
    user_id: string;
    product_id: string;
    variant_id?: string;
    name: string;
    image: string;
    sku: string;
    quantity: number;
    unit_price: { amount: number; currency: string };
  }): Promise<any> {
    return this.client.call('AddToCart', data);
  }

  async updateItemQuantity(data: {
    user_id: string;
    item_id: string;
    quantity: number;
  }): Promise<any> {
    return this.client.call('UpdateItemQuantity', data);
  }

  async removeItem(userId: string, itemId: string): Promise<any> {
    return this.client.call('RemoveItem', {
      user_id: userId,
      item_id: itemId,
    });
  }

  async clearCart(userId: string): Promise<any> {
    return this.client.call('ClearCart', { user_id: userId });
  }

  async applyCoupon(userId: string, couponCode: string): Promise<any> {
    return this.client.call('ApplyCoupon', {
      user_id: userId,
      coupon_code: couponCode,
    });
  }

  async removeCoupon(userId: string): Promise<any> {
    return this.client.call('RemoveCoupon', { user_id: userId });
  }
}
