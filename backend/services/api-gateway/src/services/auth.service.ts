import { Injectable, UnauthorizedException, BadRequestException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ProxyService } from './proxy.service';
import { LoginDto, RegisterDto } from '../dtos/auth.dto';
import * as bcrypt from 'bcrypt';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { JWT_CONFIG, CACHE_KEYS, CACHE_TTL } from '../common/constants';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly proxyService: ProxyService,
    @Inject('REDIS_CLIENT')
    private readonly redisClient: Redis,
  ) {}

  async register(registerDto: RegisterDto) {
    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Forward to user service to create user
    try {
      const user = await this.proxyService.forwardToUserService(
        '/users',
        'POST',
        {
          email: registerDto.email,
          password: hashedPassword,
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
        },
      );

      // Generate tokens
      const tokens = await this.generateTokens(user.data.id, user.data.email);

      return {
        user: {
          id: user.data.id,
          email: user.data.email,
          firstName: user.data.firstName,
          lastName: user.data.lastName,
        },
        ...tokens,
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Registration failed');
    }
  }

  async login(loginDto: LoginDto) {
    try {
      // Get user from user service
      const userResponse = await this.proxyService.forwardToUserService(
        `/users/email/${loginDto.email}`,
        'GET',
      );

      if (!userResponse.success || !userResponse.data) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const user = userResponse.data;

      // Verify password
      const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Generate tokens
      const tokens = await this.generateTokens(user.id, user.email);

      // Store session in Redis
      await this.storeSession(user.id, tokens.accessToken);

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        ...tokens,
      };
    } catch (error) {
      throw new UnauthorizedException(error.message || 'Invalid credentials');
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: JWT_CONFIG.SECRET,
      });

      // Generate new tokens
      const tokens = await this.generateTokens(payload.sub, payload.email);

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: JWT_CONFIG.SECRET,
        expiresIn: JWT_CONFIG.EXPIRES_IN,
      }),
      this.jwtService.signAsync(payload, {
        secret: JWT_CONFIG.SECRET,
        expiresIn: JWT_CONFIG.REFRESH_EXPIRES_IN,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async storeSession(userId: string, token: string) {
    const sessionKey = `${CACHE_KEYS.USER_SESSION}${userId}`;
    await this.redisClient.setex(sessionKey, CACHE_TTL.USER_SESSION, token);
  }
}
