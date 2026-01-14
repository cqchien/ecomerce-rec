import { Injectable, UnauthorizedException, BadRequestException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ProxyService } from './proxy.service';
import { LoginDto, RegisterDto } from '../dtos/auth.dto';
import Redis from 'ioredis';

@Injectable()
export class AuthService {
  private readonly authServiceUrl: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly proxyService: ProxyService,
    @Inject('REDIS_CLIENT')
    private readonly redisClient: Redis,
  ) {
    this.authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';
  }

  async register(registerDto: RegisterDto) {
    try {
      // Transform firstName and lastName to name for auth-service
      const authRegisterDto = {
        email: registerDto.email,
        password: registerDto.password,
        name: `${registerDto.firstName} ${registerDto.lastName}`.trim(),
      };

      // Forward to auth-service for registration
      const response = await this.proxyService.forwardRequest(
        this.authServiceUrl,
        '/auth/register',
        'POST',
        authRegisterDto,
      );

      return response;
    } catch (error) {
      throw new BadRequestException(error.message || 'Registration failed');
    }
  }

  async login(loginDto: LoginDto) {
    try {
      // Forward to auth-service for login
      const response = await this.proxyService.forwardRequest(
        this.authServiceUrl,
        '/auth/login',
        'POST',
        loginDto,
      );

      return response;
    } catch (error) {
      throw new UnauthorizedException(error.message || 'Invalid credentials');
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      // Forward to auth-service for token refresh
      const response = await this.proxyService.forwardRequest(
        this.authServiceUrl,
        '/auth/refresh',
        'POST',
        { refreshToken },
      );

      return response;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(refreshToken?: string) {
    try {
      // Forward to auth-service for logout
      const response = await this.proxyService.forwardRequest(
        this.authServiceUrl,
        '/auth/logout',
        'POST',
        { refreshToken },
      );

      return response;
    } catch (error) {
      throw new BadRequestException(error.message || 'Logout failed');
    }
  }
}
