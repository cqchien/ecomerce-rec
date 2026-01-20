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
    min_rating?: number;
    is_featured?: boolean;
    is_new?: boolean;
    is_on_sale?: boolean;
    sort_by?: string;
  }): Promise<any> {
    // Structure the request according to the proto definition
    const request: any = {
      pagination: {
        page: params.page || 1,
        page_size: params.page_size || 20,
      },
      filters: {},
      sort: {},
    };

    // Add filters
    if (params.category_id) {
      request.filters.category_id = params.category_id;
    }
    if (params.min_price !== undefined) {
      request.filters.min_price_cents = params.min_price;
    }
    if (params.max_price !== undefined) {
      request.filters.max_price_cents = params.max_price;
    }
    if (params.min_rating !== undefined) {
      request.filters.min_rating = params.min_rating;
    }
    if (params.is_featured) {
      request.filters.featured_only = true;
    }
    if (params.is_on_sale) {
      request.filters.on_sale_only = true;
    }

    // Add sorting
    if (params.sort_by) {
      const sortMapping: { [key: string]: { field: string; direction: number } } = {
        'price-asc': { field: 'price', direction: 0 }, // ASC
        'price-desc': { field: 'price', direction: 1 }, // DESC
        'rating': { field: 'rating', direction: 1 }, // DESC (highest first)
        'newest': { field: 'created_at', direction: 1 }, // DESC (newest first)
        'name': { field: 'name', direction: 0 }, // ASC
        'featured': { field: 'rating', direction: 1 }, // Default to rating DESC
      };

      const sortConfig = sortMapping[params.sort_by] || sortMapping['featured'];
      request.sort = {
        field: sortConfig.field,
        direction: sortConfig.direction,
      };
    }

    return this.client.call('ListProducts', request);
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
