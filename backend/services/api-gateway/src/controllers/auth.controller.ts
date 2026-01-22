import { 
  Controller, 
  Post, 
  Body, 
  HttpCode, 
  HttpStatus, 
  ValidationPipe,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { AuthGrpcClient } from '../grpc-clients/auth-grpc.client';
import { LoginDto, RegisterDto } from '../dtos/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authGrpcClient: AuthGrpcClient) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body(ValidationPipe) registerDto: RegisterDto) {
    try {
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
    } catch (error) {
      this.handleGrpcError(error);
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body(ValidationPipe) loginDto: LoginDto) {
    try {
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
    } catch (error) {
      this.handleGrpcError(error);
    }
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body('refreshToken') refreshToken: string) {
    try {
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
    } catch (error) {
      this.handleGrpcError(error);
    }
  }

  /**
   * Convert gRPC errors to HTTP exceptions
   */
  private handleGrpcError(error: any): never {
    const grpcCode = error?.code;
    const message = error?.message || 'An error occurred';

    // gRPC status codes mapping
    // https://grpc.github.io/grpc/core/md_doc_statuscodes.html
    switch (grpcCode) {
      case 3: // INVALID_ARGUMENT
        throw new BadRequestException(message);
      case 6: // ALREADY_EXISTS
        throw new ConflictException(message);
      case 16: // UNAUTHENTICATED
        throw new UnauthorizedException(message);
      case 7: // PERMISSION_DENIED
        throw new UnauthorizedException(message);
      case 5: // NOT_FOUND
        throw new BadRequestException(message);
      default:
        throw new BadRequestException(message);
    }
  }
}

