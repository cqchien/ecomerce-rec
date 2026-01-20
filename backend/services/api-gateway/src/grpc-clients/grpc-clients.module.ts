import { Module, Global } from '@nestjs/common';
import { AuthGrpcClient } from './auth-grpc.client';
import { UserGrpcClient } from './user-grpc.client';
import { ProductGrpcClient } from './product-grpc.client';
import { CartGrpcClient } from './cart-grpc.client';
import { OrderGrpcClient } from './order-grpc.client';
import { PaymentGrpcClient } from './payment-grpc.client';
import { RecommendationGrpcClient } from './recommendation.grpc-client';

@Global()
@Module({
  providers: [
    AuthGrpcClient,
    UserGrpcClient,
    ProductGrpcClient,
    CartGrpcClient,
    OrderGrpcClient,
    PaymentGrpcClient,
    RecommendationGrpcClient,
  ],
  exports: [
    AuthGrpcClient,
    UserGrpcClient,
    ProductGrpcClient,
    CartGrpcClient,
    OrderGrpcClient,
    PaymentGrpcClient,
    RecommendationGrpcClient,
  ],
})
export class GrpcClientsModule {}
