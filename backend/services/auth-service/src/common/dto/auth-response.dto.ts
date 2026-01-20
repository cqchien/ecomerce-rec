import { User } from '../entities/user.entity';

/**
 * DTO for user response data
 * Excludes sensitive fields like password and tokens
 */
export class UserResponseDto {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatar: string | null;
  role: string;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  constructor(user: Partial<User>) {
    this.id = user.id || '';
    this.email = user.email || '';
    this.name = user.name || '';
    this.phone = user.phone || null;
    this.avatar = user.avatar || null;
    this.role = user.role || 'customer';
    this.emailVerified = user.emailVerified || false;
    this.isActive = user.isActive !== undefined ? user.isActive : true;
    this.createdAt = user.createdAt ? user.createdAt.toISOString() : new Date().toISOString();
    this.updatedAt = user.updatedAt ? user.updatedAt.toISOString() : new Date().toISOString();
  }
}

/**
 * DTO for registration response
 */
export class RegisterResponseDto {
  user: UserResponseDto;
  accessToken: string;
  refreshToken: string;

  constructor(user: Partial<User>, accessToken: string, refreshToken: string) {
    this.user = new UserResponseDto(user);
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }
}

/**
 * DTO for login response
 */
export class LoginResponseDto {
  user: UserResponseDto;
  accessToken: string;
  refreshToken: string;

  constructor(user: Partial<User>, accessToken: string, refreshToken: string) {
    this.user = new UserResponseDto(user);
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }
}

/**
 * DTO for token refresh response
 */
export class RefreshTokenResponseDto {
  accessToken: string;
  refreshToken: string;

  constructor(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }
}

/**
 * DTO for logout response
 */
export class LogoutResponseDto {
  message: string;

  constructor(message = 'Logged out successfully') {
    this.message = message;
  }
}

/**
 * DTO for password reset request response
 */
export class ForgotPasswordResponseDto {
  message: string;

  constructor(message = 'Password reset email sent') {
    this.message = message;
  }
}

/**
 * DTO for password reset confirmation response
 */
export class ResetPasswordResponseDto {
  message: string;

  constructor(message = 'Password has been reset successfully') {
    this.message = message;
  }
}

/**
 * DTO for email verification response
 */
export class VerifyEmailResponseDto {
  message: string;
  emailVerified: boolean;

  constructor(message = 'Email verified successfully', emailVerified = true) {
    this.message = message;
    this.emailVerified = emailVerified;
  }
}
