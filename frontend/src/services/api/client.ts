import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { API_BASE_URL } from '@/config/api';

// API Response wrapper types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  error?: string;
  details?: Record<string, any>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle responses and errors
apiClient.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    // Return the data directly for successful responses
    return response.data;
  },
  async (error: AxiosError<ApiResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Don't retry for auth endpoints (login, register) - let them handle their own errors
    const isAuthEndpoint = originalRequest.url?.includes('/auth/login') || 
                          originalRequest.url?.includes('/auth/register');

    // Handle 401 Unauthorized - Token expired (but not for auth endpoints)
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refresh_token');
      
      if (refreshToken) {
        try {
          // Attempt to refresh the token
          const { data } = await axios.post<ApiResponse<{ token: string; refreshToken: string }>>(
            `${API_BASE_URL}/auth/refresh`,
            { refreshToken }
          );

          if (data.success && data.data.token) {
            // Store new tokens
            localStorage.setItem('access_token', data.data.token);
            if (data.data.refreshToken) {
              localStorage.setItem('refresh_token', data.data.refreshToken);
            }
            
            // Update auth store to prevent redirect after refresh
            // Note: We import dynamically to avoid circular dependency
            import('@/stores/authStore').then(({ useAuthStore }) => {
              useAuthStore.getState().checkAuth();
            });

            // Retry the original request with new token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${data.data.token}`;
            }
            return apiClient(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed, clear tokens and redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    // Handle other errors
    const errorMessage = error.response?.data?.message || error.message || 'An error occurred';
    const errorCode = error.response?.data?.error || 'UNKNOWN_ERROR';
    
    // Log error in development
    if (import.meta.env.DEV) {
      console.error('API Error:', {
        status: error.response?.status,
        code: errorCode,
        message: errorMessage,
        details: error.response?.data?.details,
        url: error.config?.url,
      });
    }

    return Promise.reject({
      message: errorMessage,
      code: errorCode,
      status: error.response?.status,
      details: error.response?.data?.details,
    });
  }
);

export default apiClient;
