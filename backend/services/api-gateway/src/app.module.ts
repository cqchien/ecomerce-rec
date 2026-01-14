import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { RedisModule } from './infrastructure/redis.module';
import { GrpcClientsModule } from './grpc-clients/grpc-clients.module';
import { ProxyController } from './controllers/proxy.controller';
import { AuthController } from './controllers/auth.controller';
import { HealthController } from './controllers/health.controller';
import { UserController } from './controllers/user.controller';
import { ProductController } from './controllers/product.controller';
import { CartController } from './controllers/cart.controller';
import { OrderController } from './controllers/order.controller';
import { CheckoutController } from './controllers/checkout.controller';
import { ProxyService } from './services/proxy.service';
import { AuthService } from './services/auth.service';
import { HealthService } from './services/health.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoggingMiddleware } from './middleware/logging.middleware';
import { AllExceptionsFilter } from './filters/all-exceptions.filter';
import { JWT_CONFIG, RATE_LIMIT } from './common/constants';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
    JwtModule.register({
      global: true,
      secret: JWT_CONFIG.SECRET,
      signOptions: { expiresIn: JWT_CONFIG.EXPIRES_IN },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: RATE_LIMIT.WINDOW_MS,
        limit: RATE_LIMIT.MAX_REQUESTS,
      },
    ]),
    RedisModule,
    GrpcClientsModule,
  ],
  controllers: [
    AuthController,
    HealthController,
    UserController,
    ProductController,
    CartController,
    OrderController,
    CheckoutController,
    // ProxyController, // Remove old proxy controller as we now use direct gRPC
  ],
  providers: [
    ProxyService,
    AuthService,
    HealthService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
