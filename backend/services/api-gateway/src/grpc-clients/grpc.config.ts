import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { join } from 'path';

export interface GrpcClientConfig {
  protoPath: string;
  packageName: string;
  serviceName: string;
  url: string;
}

export class GrpcClient {
  private client: any;

  constructor(private config: GrpcClientConfig) {
    this.initializeClient();
  }

  private initializeClient() {
    const PROTO_PATH = join(__dirname, '../../proto', this.config.protoPath);
    
    const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    });

    const protoDescriptor: any = grpc.loadPackageDefinition(packageDefinition);
    const servicePackage = protoDescriptor[this.config.packageName];

    if (!servicePackage || !servicePackage[this.config.serviceName]) {
      throw new Error(
        `Service ${this.config.serviceName} not found in package ${this.config.packageName}`,
      );
    }

    this.client = new servicePackage[this.config.serviceName](
      this.config.url,
      grpc.credentials.createInsecure(),
    );
  }

  getClient(): any {
    return this.client;
  }

  /**
   * Call a gRPC method with promise-based interface
   */
  call<TRequest, TResponse>(
    method: string,
    request: TRequest,
  ): Promise<TResponse> {
    return new Promise((resolve, reject) => {
      this.client[method](request, (error: any, response: TResponse) => {
        if (error) {
          // Transform gRPC error to a more useful format
          const grpcError = new Error(error.details || error.message);
          grpcError['code'] = error.code;
          grpcError['metadata'] = error.metadata;
          reject(grpcError);
        } else {
          resolve(response);
        }
      });
    });
  }
}

// Service URLs from environment variables
export const GRPC_SERVICES = {
  AUTH_SERVICE: process.env.AUTH_SERVICE_GRPC_URL || 'auth-service:50051',
  USER_SERVICE: process.env.USER_SERVICE_GRPC_URL || 'user-service:5001',
  PRODUCT_SERVICE: process.env.PRODUCT_SERVICE_GRPC_URL || 'product-service:4003',
  CART_SERVICE: process.env.CART_SERVICE_GRPC_URL || 'cart-service:50053',
  ORDER_SERVICE: process.env.ORDER_SERVICE_GRPC_URL || 'order-service:50054',
  PAYMENT_SERVICE: process.env.PAYMENT_SERVICE_GRPC_URL || 'payment-service:50055',
  INVENTORY_SERVICE: process.env.INVENTORY_SERVICE_GRPC_URL || 'inventory-service:50052',
  RECOMMENDATION_SERVICE: process.env.RECOMMENDATION_SERVICE_GRPC_URL || 'recommendation-service:4005',
} as const;
