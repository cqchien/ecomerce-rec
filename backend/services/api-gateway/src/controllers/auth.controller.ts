import { Controller, Post, Body, HttpCode, HttpStatus, ValidationPipe } from '@nestjs/common';
import { AuthGrpcClient } from '../grpc-clients/auth-grpc.client';
import { LoginDto, RegisterDto } from '../dtos/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authGrpcClient: AuthGrpcClient) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body(ValidationPipe) registerDto: RegisterDto) {
    const result = await this.authGrpcClient.register({
      email: registerDto.email,
      password: registerDto.password,
      first_name: registerDto.firstName,
      last_name: registerDto.lastName,
    });
    return {
      success: true,
      message: 'User registered successfully',
      data: {
        user: { id: result.user_id },
        accessToken: result.access_token,
        refreshToken: result.refresh_token,
      },
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body(ValidationPipe) loginDto: LoginDto) {
    const result = await this.authGrpcClient.login({
      email: loginDto.email,
      password: loginDto.password,
    });
    return {
      success: true,
      message: 'Login successful',
      data: {
        user: { id: result.user_id, email: result.email },
        accessToken: result.access_token,
        refreshToken: result.refresh_token,
      },
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body('refreshToken') refreshToken: string) {
    const result = await this.authGrpcClient.refreshToken({
      refresh_token: refreshToken,
    });
    return {
      success: true,
      message: 'Token refreshed',
      data: {
        accessToken: result.access_token,
        refreshToken: result.refresh_token,
      },
    };
  }
}
