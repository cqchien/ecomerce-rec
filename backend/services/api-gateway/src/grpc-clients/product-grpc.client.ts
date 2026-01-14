import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { GrpcClient, GRPC_SERVICES } from './grpc.config';

@Injectable()
export class ProductGrpcClient implements OnModuleInit {
  private readonly logger = new Logger(ProductGrpcClient.name);
  private client: GrpcClient;

  onModuleInit() {
    this.client = new GrpcClient({
      protoPath: 'product.proto',
      packageName: 'product',
      serviceName: 'ProductService',
      url: GRPC_SERVICES.PRODUCT_SERVICE,
    });
    this.logger.log(`Connected to Product Service at ${GRPC_SERVICES.PRODUCT_SERVICE}`);
  }

  async getProduct(productId: string): Promise<any> {
    return this.client.call('GetProduct', { id: productId });
  }

  async listProducts(params: {
    page?: number;
    page_size?: number;
    category_id?: string;
    min_price?: number;
    max_price?: number;
    is_featured?: boolean;
    is_new?: boolean;
    is_on_sale?: boolean;
  }): Promise<any> {
    return this.client.call('ListProducts', params);
  }

  async searchProducts(params: {
    query: string;
    page?: number;
    page_size?: number;
    category_id?: string;
  }): Promise<any> {
    return this.client.call('SearchProducts', params);
  }

  async listCategories(): Promise<any> {
    return this.client.call('ListCategories', {});
  }

  async getCategory(categoryId: string): Promise<any> {
    return this.client.call('GetCategory', { category_id: categoryId });
  }

  async getRelatedProducts(productId: string, limit?: number): Promise<any> {
    return this.client.call('GetRelatedProducts', {
      product_id: productId,
      limit: limit || 10,
    });
  }

  async getProductsByIds(productIds: string[]): Promise<any> {
    return this.client.call('GetProductsByIds', { product_ids: productIds });
  }
}
