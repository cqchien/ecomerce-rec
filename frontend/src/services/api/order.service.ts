import apiClient, { ApiResponse, PaginatedResponse } from './client';
import { API_ENDPOINTS } from '@/config/api';
import type { Address } from './user.service';

export interface OrderItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  image: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export type OrderStatus = 
  | 'PENDING'
  | 'PROCESSING'
  | 'PAYMENT_PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export interface TrackingInfo {
  trackingNumber: string;
  carrier: string;
  url: string;
  shippedAt?: string;
  estimatedDelivery?: string;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  discount: number;
  total: number;
  status: OrderStatus;
  shippingAddress: Address;
  billingAddress?: Address;
  paymentMethod: string;
  paymentId?: string;
  tracking?: TrackingInfo;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderData {
  shippingAddressId: string;
  billingAddressId?: string;
  paymentMethod: string;
  couponCode?: string;
}

export const orderService = {
  /**
   * Create new order
   */
  async createOrder(data: CreateOrderData): Promise<Order> {
    const response = await apiClient.post<ApiResponse<Order>>(
      API_ENDPOINTS.orders.create,
      data
    );
    return response.data;
  },

  /**
   * Get user orders with pagination
   */
  async getOrders(page = 1, limit = 10, status?: OrderStatus): Promise<PaginatedResponse<Order>> {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Order>>>(
      API_ENDPOINTS.orders.list,
      { params: { page, limit, status } }
    );
    return response.data;
  },

  /**
   * Get order by ID
   */
  async getOrder(orderId: string): Promise<Order> {
    const response = await apiClient.get<ApiResponse<Order>>(
      API_ENDPOINTS.orders.detail(orderId)
    );
    return response.data;
  },

  /**
   * Cancel order
   */
  async cancelOrder(orderId: string): Promise<Order> {
    const response = await apiClient.post<ApiResponse<Order>>(
      API_ENDPOINTS.orders.cancel(orderId)
    );
    return response.data;
  },

  /**
   * Get order status history
   */
  async getOrderStatusHistory(orderId: string): Promise<any[]> {
    // This would be a new endpoint
    const response = await apiClient.get<ApiResponse<any[]>>(
      `/orders/${orderId}/history`
    );
    return response.data;
  },
};
