import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { GrpcClient, GRPC_SERVICES } from './grpc.config';

@Injectable()
export class UserGrpcClient implements OnModuleInit {
  private readonly logger = new Logger(UserGrpcClient.name);
  private client: GrpcClient;

  onModuleInit() {
    this.client = new GrpcClient({
      protoPath: 'user.proto',
      packageName: 'user',
      serviceName: 'UserService',
      url: GRPC_SERVICES.USER_SERVICE,
    });
    this.logger.log(`Connected to User Service at ${GRPC_SERVICES.USER_SERVICE}`);
  }

  async getProfile(userId: string): Promise<any> {
    return this.client.call('GetProfile', { user_id: userId });
  }

  async updateProfile(data: {
    user_id: string;
    name?: string;
    phone?: string;
    avatar?: string;
  }): Promise<any> {
    return this.client.call('UpdateProfile', data);
  }

  async listAddresses(userId: string): Promise<any> {
    return this.client.call('ListAddresses', { user_id: userId });
  }

  async addAddress(data: any): Promise<any> {
    return this.client.call('AddAddress', data);
  }

  async updateAddress(data: any): Promise<any> {
    return this.client.call('UpdateAddress', data);
  }

  async deleteAddress(addressId: string, userId: string): Promise<any> {
    return this.client.call('DeleteAddress', {
      address_id: addressId,
      user_id: userId,
    });
  }

  async getPreferences(userId: string): Promise<any> {
    return this.client.call('GetPreferences', { user_id: userId });
  }

  async updatePreferences(data: any): Promise<any> {
    return this.client.call('UpdatePreferences', data);
  }

  async getWishlist(userId: string): Promise<any> {
    return this.client.call('GetWishlist', { user_id: userId });
  }

  async addToWishlist(userId: string, productId: string): Promise<any> {
    return this.client.call('AddToWishlist', {
      user_id: userId,
      product_id: productId,
    });
  }

  async removeFromWishlist(userId: string, productId: string): Promise<any> {
    return this.client.call('RemoveFromWishlist', {
      user_id: userId,
      product_id: productId,
    });
  }
}
