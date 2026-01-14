import apiClient, { ApiResponse } from './client';
import { API_ENDPOINTS } from '@/config/api';

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  variantId?: string;
  name: string;
  image: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  couponCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AddToCartData {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface UpdateCartItemData {
  quantity: number;
}

export const cartService = {
  /**
   * Get user's cart
   */
  async getCart(): Promise<Cart> {
    const response = await apiClient.get<ApiResponse<Cart>>(
      API_ENDPOINTS.cart.get
    );
    return response.data;
  },

  /**
   * Add item to cart
   */
  async addToCart(data: AddToCartData): Promise<Cart> {
    const response = await apiClient.post<ApiResponse<Cart>>(
      API_ENDPOINTS.cart.add,
      data
    );
    return response.data;
  },

  /**
   * Update cart item quantity
   */
  async updateCartItem(itemId: string, data: UpdateCartItemData): Promise<Cart> {
    const response = await apiClient.put<ApiResponse<Cart>>(
      API_ENDPOINTS.cart.update(itemId),
      data
    );
    return response.data;
  },

  /**
   * Remove item from cart
   */
  async removeCartItem(itemId: string): Promise<Cart> {
    const response = await apiClient.delete<ApiResponse<Cart>>(
      API_ENDPOINTS.cart.remove(itemId)
    );
    return response.data;
  },

  /**
   * Clear entire cart
   */
  async clearCart(): Promise<void> {
    const response = await apiClient.delete<ApiResponse<void>>(
      API_ENDPOINTS.cart.clear
    );
    return response.data;
  },

  /**
   * Apply coupon code
   */
  async applyCoupon(code: string): Promise<Cart> {
    const response = await apiClient.post<ApiResponse<Cart>>(
      API_ENDPOINTS.cart.applyCoupon,
      { couponCode: code }
    );
    return response.data;
  },

  /**
   * Remove coupon code
   */
  async removeCoupon(): Promise<Cart> {
    const response = await apiClient.delete<ApiResponse<Cart>>(
      API_ENDPOINTS.cart.removeCoupon
    );
    return response.data;
  },

  /**
   * Get cart item count
   */
  async getCartItemCount(): Promise<number> {
    try {
      const cart = await this.getCart();
      return cart.items.reduce((sum, item) => sum + item.quantity, 0);
    } catch {
      return 0;
    }
  },
};
