import { Controller } from '@nestjs/common';
import { GrpcMethod, GrpcService, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { AuthService } from './auth.service';
import {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  LogoutRequest,
  LogoutResponse,
  VerifyTokenRequest,
  VerifyTokenResponse,
} from './auth.interface';

@Controller()
export class AuthGrpcController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Register user via gRPC
   */
  @GrpcMethod('AuthService', 'Register')
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    try {
      const name = data.last_name 
        ? `${data.first_name} ${data.last_name}`.trim()
        : data.first_name;

      const result = await this.authService.register({
        email: data.email,
        password: data.password,
        name,
      });

      return {
        user_id: result.user.id,
        access_token: result.accessToken,
        refresh_token: result.refreshToken,
        expires_in: 3600,
      };
    } catch (error) {
      throw new RpcException({
        code: this.getGrpcStatusCode(error),
        message: error.message || 'Registration failed',
      });
    }
  }

  /**
   * Login user via gRPC
   */
  @GrpcMethod('AuthService', 'Login')
  async login(data: LoginRequest): Promise<LoginResponse> {
    try {
      const result = await this.authService.login({
        email: data.email,
        password: data.password,
      });

      return {
        user_id: result.user.id,
        email: result.user.email,
        role: result.user.role || 'customer',
        access_token: result.accessToken,
        refresh_token: result.refreshToken,
        expires_in: 3600,
      };
    } catch (error) {
      throw new RpcException({
        code: this.getGrpcStatusCode(error),
        message: error.message || 'Login failed',
      });
    }
  }

  /**
   * Refresh access token via gRPC
   */
  @GrpcMethod('AuthService', 'RefreshToken')
  async refreshToken(data: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    try {
      const result = await this.authService.refreshTokens(data.refresh_token);

      return {
        access_token: result.accessToken,
        refresh_token: result.refreshToken,
        expires_in: 3600,
      };
    } catch (error) {
      throw new RpcException({
        code: this.getGrpcStatusCode(error),
        message: error.message || 'Token refresh failed',
      });
    }
  }

  /**
   * Logout user via gRPC
   */
  @GrpcMethod('AuthService', 'Logout')
  async logout(data: LogoutRequest): Promise<LogoutResponse> {
    try {
      await this.authService.logout(data.user_id, data.refresh_token);
      return { success: true };
    } catch (error) {
      throw new RpcException({
        code: this.getGrpcStatusCode(error),
        message: error.message || 'Logout failed',
      });
    }
  }

  /**
   * Verify JWT token via gRPC
   */
  @GrpcMethod('AuthService', 'VerifyToken')
  async verifyToken(data: VerifyTokenRequest): Promise<VerifyTokenResponse> {
    try {
      const payload = await this.authService['jwtService'].verify(data.token);
      return {
        valid: true,
        user_id: payload.sub,
        email: payload.email,
        role: payload.role || 'customer',
      };
    } catch (error) {
      return {
        valid: false,
        user_id: '',
        email: '',
        role: '',
      };
    }
  }

  /**
   * Map HTTP exceptions to gRPC status codes
   */
  private getGrpcStatusCode(error: any): number {
    const statusCode = error?.status;
    
    switch (statusCode) {
      case 400: // BadRequestException
        return status.INVALID_ARGUMENT;
      case 401: // UnauthorizedException
        return status.UNAUTHENTICATED;
      case 403: // ForbiddenException
        return status.PERMISSION_DENIED;
      case 404: // NotFoundException
        return status.NOT_FOUND;
      case 409: // ConflictException
        return status.ALREADY_EXISTS;
      case 429: // TooManyRequestsException
        return status.RESOURCE_EXHAUSTED;
      default:
        return status.INTERNAL;
    }
  }
}
