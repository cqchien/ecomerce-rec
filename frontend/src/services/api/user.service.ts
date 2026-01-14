import apiClient, { ApiResponse } from './client';
import { API_ENDPOINTS } from '@/config/api';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

export interface UserPreferences {
  userId: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
  language: string;
  currency: string;
}

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  product?: {
    id: string;
    name: string;
    price: number;
    image: string;
    rating?: number;
  };
  addedAt: string;
}

export interface UpdateProfileData {
  name?: string;
  phone?: string;
  avatar?: string;
}

export interface AddAddressData {
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault?: boolean;
}

export const userService = {
  /**
   * Get user profile
   */
  async getProfile(): Promise<UserProfile> {
    const response = await apiClient.get<ApiResponse<UserProfile>>(
      API_ENDPOINTS.user.profile
    );
    return response.data;
  },

  /**
   * Update user profile
   */
  async updateProfile(data: UpdateProfileData): Promise<UserProfile> {
    const response = await apiClient.put<ApiResponse<UserProfile>>(
      API_ENDPOINTS.user.updateProfile,
      data
    );
    
    // Update local storage
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      localStorage.setItem('user', JSON.stringify({ ...userData, ...response.data }));
    }
    
    return response.data;
  },

  /**
   * Get user addresses
   */
  async getAddresses(): Promise<Address[]> {
    const response = await apiClient.get<ApiResponse<Address[]>>(
      API_ENDPOINTS.user.addresses
    );
    return response.data;
  },

  /**
   * Add new address
   */
  async addAddress(data: AddAddressData): Promise<Address> {
    const response = await apiClient.post<ApiResponse<Address>>(
      API_ENDPOINTS.user.addAddress,
      data
    );
    return response.data;
  },

  /**
   * Update address
   */
  async updateAddress(id: string, data: Partial<AddAddressData>): Promise<Address> {
    const response = await apiClient.put<ApiResponse<Address>>(
      API_ENDPOINTS.user.updateAddress(id),
      data
    );
    return response.data;
  },

  /**
   * Delete address
   */
  async deleteAddress(id: string): Promise<void> {
    const response = await apiClient.delete<ApiResponse<void>>(
      API_ENDPOINTS.user.deleteAddress(id)
    );
    return response.data;
  },

  /**
   * Get user preferences
   */
  async getPreferences(): Promise<UserPreferences> {
    const response = await apiClient.get<ApiResponse<UserPreferences>>(
      API_ENDPOINTS.user.preferences
    );
    return response.data;
  },

  /**
   * Update user preferences
   */
  async updatePreferences(data: Partial<UserPreferences>): Promise<UserPreferences> {
    const response = await apiClient.put<ApiResponse<UserPreferences>>(
      API_ENDPOINTS.user.preferences,
      data
    );
    return response.data;
  },

  /**
   * Get wishlist
   */
  async getWishlist(): Promise<WishlistItem[]> {
    const response = await apiClient.get<ApiResponse<WishlistItem[]>>(
      API_ENDPOINTS.user.wishlist
    );
    return response.data;
  },

  /**
   * Add product to wishlist
   */
  async addToWishlist(productId: string): Promise<WishlistItem> {
    const response = await apiClient.post<ApiResponse<WishlistItem>>(
      API_ENDPOINTS.user.addToWishlist,
      { productId }
    );
    return response.data;
  },

  /**
   * Remove product from wishlist
   */
  async removeFromWishlist(productId: string): Promise<void> {
    const response = await apiClient.delete<ApiResponse<void>>(
      API_ENDPOINTS.user.removeFromWishlist(productId)
    );
    return response.data;
  },
};
