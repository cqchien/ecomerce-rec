import { Controller } from '@nestjs/common';
import { GrpcMethod, GrpcService } from '@nestjs/microservices';
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

  @GrpcMethod('AuthService', 'Register')
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    // Map gRPC first_name and last_name to the name field
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
  }

  @GrpcMethod('AuthService', 'Login')
  async login(data: LoginRequest): Promise<LoginResponse> {
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
  }

  @GrpcMethod('AuthService', 'RefreshToken')
  async refreshToken(data: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    const result = await this.authService.refreshTokens(data.refresh_token);

    return {
      access_token: result.accessToken,
      refresh_token: result.refreshToken,
      expires_in: 3600,
    };
  }

  @GrpcMethod('AuthService', 'Logout')
  async logout(data: LogoutRequest): Promise<LogoutResponse> {
    await this.authService.logout(data.user_id, data.refresh_token);
    return { success: true };
  }

  @GrpcMethod('AuthService', 'VerifyToken')
  async verifyToken(data: VerifyTokenRequest): Promise<VerifyTokenResponse> {
    try {
      // Use jwtService directly to verify the token
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
}
