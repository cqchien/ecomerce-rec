import apiClient, { ApiResponse } from './client';
import { API_ENDPOINTS } from '@/config/api';

export interface CheckoutCalculation {
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  savings?: number;
}

export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed';
}

export interface CheckoutConfirmData {
  paymentIntentId: string;
  shippingAddressId: string;
  billingAddressId?: string;
  paymentMethod: string;
  couponCode?: string;
}

export interface CheckoutConfirmation {
  orderId: string;
  paymentId: string;
  status: 'success' | 'failed';
  total: number;
  message?: string;
}

export const checkoutService = {
  /**
   * Calculate checkout totals
   */
  async calculateCheckout(
    shippingAddressId: string,
    couponCode?: string
  ): Promise<CheckoutCalculation> {
    const response = await apiClient.post<ApiResponse<CheckoutCalculation>>(
      API_ENDPOINTS.checkout.calculate,
      { shippingAddressId, couponCode }
    );
    return response.data;
  },

  /**
   * Create payment intent
   */
  async createPaymentIntent(amount: number, currency = 'USD'): Promise<PaymentIntent> {
    const response = await apiClient.post<ApiResponse<PaymentIntent>>(
      API_ENDPOINTS.checkout.paymentIntent,
      { amount, currency }
    );
    return response.data;
  },

  /**
   * Confirm and complete checkout
   */
  async confirmCheckout(data: CheckoutConfirmData): Promise<CheckoutConfirmation> {
    const response = await apiClient.post<ApiResponse<CheckoutConfirmation>>(
      API_ENDPOINTS.checkout.confirm,
      data
    );
    return response.data;
  },
};
