import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User, UserRole } from '../../common/entities/user.entity';
import { RefreshToken } from '../../common/entities/refresh-token.entity';
import { RegisterDto, LoginDto } from '../../common/dto/auth.dto';
import {
  RegisterResponseDto,
  LoginResponseDto,
  RefreshTokenResponseDto,
  ForgotPasswordResponseDto,
  ResetPasswordResponseDto,
  VerifyEmailResponseDto,
  UserResponseDto,
} from '../../common/dto/auth-response.dto';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Register a new user account
   * @param registerDto User registration data
   * @return Registration response with user data and tokens
   */
  async register(registerDto: RegisterDto): Promise<RegisterResponseDto> {
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const verificationToken = uuidv4();

    const user = this.userRepository.create({
      email: registerDto.email,
      password: hashedPassword,
      name: registerDto.name,
      role: UserRole.CUSTOMER,
      verificationToken,
      emailVerified: false,
    });

    await this.userRepository.save(user);

    const { accessToken, refreshToken } = await this.generateTokens(user);
    await this.storeSession(user.id, accessToken);

    const { password, verificationToken: _, resetPasswordToken, ...userWithoutSensitiveData } = user;

    return new RegisterResponseDto(userWithoutSensitiveData, accessToken, refreshToken);
  }

  /**
   * Authenticate user and create session
   * @param loginDto User login credentials
   * @param ipAddress Client IP address
   * @param userAgent Client user agent
   * @return Login response with user data and tokens
   */
  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string): Promise<LoginResponseDto> {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { accessToken, refreshToken } = await this.generateTokens(user, ipAddress, userAgent);
    await this.storeSession(user.id, accessToken);

    const { password, verificationToken, resetPasswordToken, ...userWithoutSensitiveData } = user;

    return new LoginResponseDto(userWithoutSensitiveData, accessToken, refreshToken);
  }

  /**
   * Validate user credentials
   * @param email User email
   * @param password User password
   * @return User entity if valid, null otherwise
   */
  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    return user;
  }

  /**
   * Refresh access token using refresh token
   * @param refreshToken Refresh token string
   * @return New access and refresh tokens
   */
  async refreshTokens(refreshToken: string): Promise<RefreshTokenResponseDto> {
    const storedToken = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken, revoked: false },
      relations: ['user'],
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (new Date() > storedToken.expiresAt) {
      throw new UnauthorizedException('Refresh token expired');
    }

    storedToken.revoked = true;
    storedToken.revokedAt = new Date();
    await this.refreshTokenRepository.save(storedToken);

    const tokens = await this.generateTokens(storedToken.user);

    storedToken.replacedByToken = tokens.refreshToken;
    await this.refreshTokenRepository.save(storedToken);

    return new RefreshTokenResponseDto(tokens.accessToken, tokens.refreshToken);
  }

  /**
   * Logout user and invalidate session
   * @param userId User ID
   * @param refreshToken Optional refresh token to revoke
   */
  async logout(userId: string, refreshToken?: string): Promise<void> {
    await this.redisService.del(`session:${userId}`);

    if (refreshToken) {
      const storedToken = await this.refreshTokenRepository.findOne({
        where: { token: refreshToken, userId },
      });

      if (storedToken) {
        storedToken.revoked = true;
        storedToken.revokedAt = new Date();
        await this.refreshTokenRepository.save(storedToken);
      }
    }
  }

  /**
   * Initiate password reset process
   * @param email User email address
   * @return Confirmation message
   */
  async forgotPassword(email: string): Promise<ForgotPasswordResponseDto> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      return new ForgotPasswordResponseDto('If the email exists, a reset link will be sent');
    }

    const resetToken = uuidv4();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000);

    await this.userRepository.save(user);

    return new ForgotPasswordResponseDto('If the email exists, a reset link will be sent');
  }

  /**
   * Reset user password with token
   * @param token Password reset token
   * @param newPassword New password
   * @return Confirmation message
   */
  async resetPassword(token: string, newPassword: string): Promise<ResetPasswordResponseDto> {
    const user = await this.userRepository.findOne({
      where: { resetPasswordToken: token },
    });

    if (!user || !user.resetPasswordExpires || new Date() > user.resetPasswordExpires) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await this.userRepository.save(user);

    await this.refreshTokenRepository.update(
      { userId: user.id, revoked: false },
      { revoked: true, revokedAt: new Date() }
    );

    return new ResetPasswordResponseDto();
  }

  /**
   * Verify user email address
   * @param token Email verification token
   * @return Verification confirmation
   */
  async verifyEmail(token: string): Promise<VerifyEmailResponseDto> {
    const user = await this.userRepository.findOne({
      where: { verificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    user.emailVerified = true;
    user.verificationToken = null;

    await this.userRepository.save(user);

    return new VerifyEmailResponseDto();
  }

  /**
   * Get user profile by ID
   * @param id User ID
   * @return User profile without sensitive data
   */
  async getUserById(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return new UserResponseDto(user);
  }

  /**
   * Generate access and refresh tokens for user
   * @param user User entity
   * @param ipAddress Client IP address
   * @param userAgent Client user agent
   * @return Access and refresh tokens
   */
  private async generateTokens(user: User, ipAddress?: string, userAgent?: string): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(payload);
    const refreshTokenValue = uuidv4();
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);

    const refreshToken = this.refreshTokenRepository.create({
      token: refreshTokenValue,
      userId: user.id,
      expiresAt: refreshTokenExpiry,
      ipAddress,
      userAgent,
    });

    await this.refreshTokenRepository.save(refreshToken);

    return {
      accessToken,
      refreshToken: refreshTokenValue,
    };
  }

  /**
   * Store user session in Redis
   * @param userId User ID
   * @param accessToken Access token
   */
  private async storeSession(userId: string, accessToken: string): Promise<void> {
    const expiresIn = this.configService.get('JWT_ACCESS_EXPIRATION') || '15m';
    const ttl = this.parseTTL(expiresIn);

    await this.redisService.set(
      `session:${userId}`,
      JSON.stringify({ userId, accessToken }),
      ttl
    );
  }

  /**
   * Parse TTL string to seconds
   * @param expiration Expiration string (e.g., '15m', '1h', '7d')
   * @return TTL in seconds
   */
  private parseTTL(expiration: string): number {
    const unit = expiration.slice(-1);
    const value = parseInt(expiration.slice(0, -1));

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 900;
    }
  }
}
