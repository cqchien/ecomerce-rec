import apiClient, { ApiResponse } from './client';
import { API_ENDPOINTS } from '@/config/api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'customer';
  avatar?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export interface BackendAuthResponse {
  user: {
    id: string;
    email: string;
    name?: string;
  };
  accessToken: string;
  refreshToken?: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
}

export const authService = {
  /**
   * User login
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<BackendAuthResponse>>(
      API_ENDPOINTS.auth.login,
      credentials
    );
    
    // Store tokens and user data
    if (response.success && response.data) {
      localStorage.setItem('access_token', response.data.accessToken);
      if (response.data.refreshToken) {
        localStorage.setItem('refresh_token', response.data.refreshToken);
      }
      
      // Transform backend response to match frontend User interface
      const user: User = {
        id: response.data.user.id,
        email: response.data.user.email,
        name: response.data.user.name || response.data.user.email.split('@')[0],
        role: 'customer',
      };
      
      localStorage.setItem('user', JSON.stringify(user));
      
      // Return in expected format
      return {
        user,
        token: response.data.accessToken,
        refreshToken: response.data.refreshToken,
      };
    }
    
    throw new Error('Login failed');
  },

  /**
   * User registration
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    // Split name into firstName and lastName for backend API
    const nameParts = data.name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || nameParts[0] || 'User';
    
    const response = await apiClient.post<ApiResponse<BackendAuthResponse>>(
      API_ENDPOINTS.auth.register,
      {
        email: data.email,
        password: data.password,
        firstName,
        lastName,
      }
    );
    
    // Store tokens and user data
    if (response.success && response.data) {
      localStorage.setItem('access_token', response.data.accessToken);
      if (response.data.refreshToken) {
        localStorage.setItem('refresh_token', response.data.refreshToken);
      }
      
      // Transform backend response to match frontend User interface
      const user: User = {
        id: response.data.user.id,
        email: response.data.user.email,
        name: response.data.user.name || data.name || response.data.user.email.split('@')[0],
        role: 'customer',
      };
      
      localStorage.setItem('user', JSON.stringify(user));
      
      // Return in expected format
      return {
        user,
        token: response.data.accessToken,
        refreshToken: response.data.refreshToken,
      };
    }
    
    throw new Error('Registration failed');
  },

  /**
   * User logout
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.auth.logout);
    } finally {
      // Clear local storage regardless of API response
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  },

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>(
      API_ENDPOINTS.auth.refresh,
      { refreshToken }
    );
    
    if (response.success && response.data) {
      localStorage.setItem('access_token', response.data.token);
      if (response.data.refreshToken) {
        localStorage.setItem('refresh_token', response.data.refreshToken);
      }
    }
    
    return response.data;
  },

  /**
   * Request password reset
   */
  async forgotPassword(data: ForgotPasswordData): Promise<void> {
    const response = await apiClient.post<ApiResponse<void>>(
      API_ENDPOINTS.auth.forgotPassword,
      data
    );
    return response.data;
  },

  /**
   * Reset password with token
   */
  async resetPassword(data: ResetPasswordData): Promise<void> {
    const response = await apiClient.post<ApiResponse<void>>(
      API_ENDPOINTS.auth.resetPassword,
      data
    );
    return response.data;
  },

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<void> {
    const response = await apiClient.post<ApiResponse<void>>(
      API_ENDPOINTS.auth.verifyEmail,
      { token }
    );
    return response.data;
  },

  /**
   * Get current user from local storage
   */
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  },

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  },
};
