import { EventPriority } from '../common/constants';

export interface EventMetadata {
  eventId: string;
  eventType: string;
  timestamp: Date;
  version: string;
  priority: EventPriority;
  source: string;
  correlationId?: string;
  userId?: string;
}

export interface EventPayload<T = any> {
  metadata: EventMetadata;
  data: T;
}

// Order Event Payloads
export interface OrderCreatedPayload {
  orderId: string;
  userId: string;
  total: number;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
}

export interface OrderConfirmedPayload {
  orderId: string;
  userId: string;
  paymentId: string;
}

export interface OrderShippedPayload {
  orderId: string;
  userId: string;
  trackingNumber: string;
  carrier: string;
  estimatedDelivery: Date;
}

// Payment Event Payloads
export interface PaymentSucceededPayload {
  paymentId: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
}

export interface PaymentFailedPayload {
  paymentId: string;
  orderId: string;
  userId: string;
  amount: number;
  reason: string;
}

// User Event Payloads
export interface UserRegisteredPayload {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
}

// Cart Event Payloads
export interface CartAbandonedPayload {
  cartId: string;
  userId: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  total: number;
  abandonedAt: Date;
}

// Inventory Event Payloads
export interface StockLowPayload {
  productId: string;
  variantId?: string;
  currentStock: number;
  threshold: number;
}
