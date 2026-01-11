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

  async register(registerDto: RegisterDto): Promise<{ user: Partial<User>; accessToken: string; refreshToken: string }> {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Create verification token
    const verificationToken = uuidv4();

    // Create user
    const user = this.userRepository.create({
      email: registerDto.email,
      password: hashedPassword,
      name: registerDto.name,
      role: UserRole.CUSTOMER,
      verificationToken,
      emailVerified: false,
    });

    await this.userRepository.save(user);

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(user);

    // Store session in Redis
    await this.storeSession(user.id, accessToken);

    // Remove password from response
    const { password, verificationToken: _, resetPasswordToken, ...userWithoutSensitiveData } = user;

    return {
      user: userWithoutSensitiveData,
      accessToken,
      refreshToken,
    };
  }

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string): Promise<{ user: Partial<User>; accessToken: string; refreshToken: string }> {
    // Validate user
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(user, ipAddress, userAgent);

    // Store session in Redis
    await this.storeSession(user.id, accessToken);

    // Remove password from response
    const { password, verificationToken, resetPasswordToken, ...userWithoutSensitiveData } = user;

    return {
      user: userWithoutSensitiveData,
      accessToken,
      refreshToken,
    };
  }

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

  async refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    // Find refresh token
    const storedToken = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken, revoked: false },
      relations: ['user'],
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if expired
    if (new Date() > storedToken.expiresAt) {
      throw new UnauthorizedException('Refresh token expired');
    }

    // Revoke old token
    storedToken.revoked = true;
    storedToken.revokedAt = new Date();
    await this.refreshTokenRepository.save(storedToken);

    // Generate new tokens
    const tokens = await this.generateTokens(storedToken.user);

    // Update replaced token reference
    storedToken.replacedByToken = tokens.refreshToken;
    await this.refreshTokenRepository.save(storedToken);

    return tokens;
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    // Remove session from Redis
    await this.redisService.del(`session:${userId}`);

    // Revoke refresh token if provided
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

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      // Don't reveal if user exists
      return { message: 'If the email exists, a reset link will be sent' };
    }

    // Generate reset token
    const resetToken = uuidv4();
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour

    await this.userRepository.save(user);

    // TODO: Send email with reset link
    // await this.emailService.sendPasswordReset(user.email, resetToken);

    return { message: 'If the email exists, a reset link will be sent' };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { resetPasswordToken: token },
    });

    if (!user || !user.resetPasswordExpires || new Date() > user.resetPasswordExpires) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Hash new password
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await this.userRepository.save(user);

    // Revoke all refresh tokens for security
    await this.refreshTokenRepository.update(
      { userId: user.id, revoked: false },
      { revoked: true, revokedAt: new Date() }
    );

    return { message: 'Password reset successful' };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { verificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    user.emailVerified = true;
    user.verificationToken = null;

    await this.userRepository.save(user);

    return { message: 'Email verified successfully' };
  }

  async getUserById(id: string): Promise<Partial<User>> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { password, verificationToken, resetPasswordToken, ...userWithoutSensitiveData } = user;

    return userWithoutSensitiveData;
  }

  private async generateTokens(user: User, ipAddress?: string, userAgent?: string): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: user.id, email: user.email, role: user.role };

    // Generate access token
    const accessToken = this.jwtService.sign(payload);

    // Generate refresh token
    const refreshTokenValue = uuidv4();
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7); // 7 days

    // Store refresh token in database
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

  private async storeSession(userId: string, accessToken: string): Promise<void> {
    const expiresIn = this.configService.get('JWT_ACCESS_EXPIRATION') || '15m';
    const ttl = this.parseTTL(expiresIn);

    await this.redisService.set(
      `session:${userId}`,
      JSON.stringify({ userId, accessToken }),
      ttl
    );
  }

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
        return 900; // 15 minutes default
    }
  }
}
