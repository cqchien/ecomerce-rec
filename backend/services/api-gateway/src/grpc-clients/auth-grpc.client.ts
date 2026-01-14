import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { GrpcClient, GRPC_SERVICES } from './grpc.config';

@Injectable()
export class AuthGrpcClient implements OnModuleInit {
  private readonly logger = new Logger(AuthGrpcClient.name);
  private client: GrpcClient;

  onModuleInit() {
    this.client = new GrpcClient({
      protoPath: 'auth.proto',
      packageName: 'auth',
      serviceName: 'AuthService',
      url: GRPC_SERVICES.AUTH_SERVICE,
    });
    this.logger.log(`Connected to Auth Service at ${GRPC_SERVICES.AUTH_SERVICE}`);
  }

  async register(data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  }): Promise<any> {
    return this.client.call('Register', data);
  }

  async login(data: { email: string; password: string }): Promise<any> {
    return this.client.call('Login', data);
  }

  async refreshToken(data: { refresh_token: string }): Promise<any> {
    return this.client.call('RefreshToken', data);
  }

  async logout(data: { user_id: string; refresh_token: string }): Promise<any> {
    return this.client.call('Logout', data);
  }

  async verifyToken(data: { token: string }): Promise<any> {
    return this.client.call('VerifyToken', data);
  }
}
