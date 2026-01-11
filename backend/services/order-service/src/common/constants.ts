// ============================================
// Order Status Constants
// ============================================
export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

// ============================================
// Payment Method Constants
// ============================================
export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PAYPAL = 'PAYPAL',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CASH_ON_DELIVERY = 'CASH_ON_DELIVERY',
}

// ============================================
// Cancellation Reason Constants
// ============================================
export enum CancellationReason {
  CUSTOMER_REQUEST = 'CUSTOMER_REQUEST',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  FRAUDULENT_ORDER = 'FRAUDULENT_ORDER',
  DELIVERY_FAILED = 'DELIVERY_FAILED',
  OTHER = 'OTHER',
}

// ============================================
// Refund Status Constants
// ============================================
export enum RefundStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

// ============================================
// Order Event Types (Deprecated - use KAFKA_TOPICS)
// ============================================
export enum OrderEventType {
  ORDER_CREATED = 'order.created',
  ORDER_CONFIRMED = 'order.confirmed',
  ORDER_CANCELLED = 'order.cancelled',
  ORDER_SHIPPED = 'order.shipped',
  ORDER_DELIVERED = 'order.delivered',
  PAYMENT_RECEIVED = 'payment.received',
  PAYMENT_FAILED = 'payment.failed',
  REFUND_INITIATED = 'refund.initiated',
  REFUND_COMPLETED = 'refund.completed',
}

// ============================================
// Kafka Topics
// ============================================
export const KAFKA_TOPICS = {
  ORDER_CREATED: 'order.created',
  ORDER_CONFIRMED: 'order.confirmed',
  ORDER_CANCELLED: 'order.cancelled',
  ORDER_SHIPPED: 'order.shipped',
  ORDER_DELIVERED: 'order.delivered',
  ORDER_UPDATED: 'order.updated',
  PAYMENT_RECEIVED: 'payment.received',
  PAYMENT_FAILED: 'payment.failed',
  REFUND_INITIATED: 'refund.initiated',
  REFUND_COMPLETED: 'refund.completed',
  // Inter-service coordination (event-driven decoupling)
  INVENTORY_RESERVE_REQUEST: 'inventory.reserve_request',
  INVENTORY_RELEASE_REQUEST: 'inventory.release_request',
  PAYMENT_REFUND_REQUEST: 'payment.refund_request',
} as const;

// ============================================
// Cache Configuration
// ============================================
export const CACHE_KEYS = {
  ORDER_BY_ID: 'order:id:',
  ORDERS_BY_USER: 'orders:user:',
  ORDER_HISTORY: 'order:history:',
  ORDER_TRACKING: 'order:tracking:',
} as const;

export const CACHE_TTL = {
  ORDER: 300, // 5 minutes
  ORDER_LIST: 180, // 3 minutes
  ORDER_HISTORY: 600, // 10 minutes
  ORDER_TRACKING: 120, // 2 minutes
} as const;

// ============================================
// Pagination Constants
// ============================================
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
} as const;

// ============================================
// Order Business Rules
// ============================================
export const ORDER_RULES = {
  MAX_ITEMS_PER_ORDER: 50,
  MIN_ORDER_AMOUNT: 0.01,
  MAX_ORDER_AMOUNT: 999999.99,
  CANCELLATION_WINDOW_HOURS: 24, // Can cancel within 24 hours
  AUTO_CONFIRM_MINUTES: 30, // Auto-confirm payment after 30 minutes
  SHIPPING_ESTIMATE_DAYS: 7,
  RESERVATION_TTL_MINUTES: 15, // Inventory reservation TTL
} as const;

// ============================================
// Decimal Precision
// ============================================
export const DECIMAL_PRECISION = {
  PRICE: 2,
  QUANTITY: 0,
  TAX_RATE: 4,
} as const;

// ============================================
// Status Transitions (Valid transitions)
// ============================================
export const ALLOWED_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.PROCESSING, OrderStatus.PAYMENT_PENDING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.PAYMENT_PENDING, OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.PAYMENT_PENDING]: [OrderStatus.CONFIRMED, OrderStatus.PAYMENT_FAILED, OrderStatus.CANCELLED],
  [OrderStatus.PAYMENT_FAILED]: [OrderStatus.PAYMENT_PENDING, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
  [OrderStatus.CANCELLED]: [OrderStatus.REFUNDED],
  [OrderStatus.REFUNDED]: [],
};

// ============================================
// Error Messages
// ============================================
export const ERROR_MESSAGES = {
  ORDER_NOT_FOUND: 'Order not found',
  INVALID_STATUS_TRANSITION: 'Invalid status transition',
  CANNOT_CANCEL_ORDER: 'Cannot cancel order in current status',
  CANCELLATION_WINDOW_EXPIRED: 'Cancellation window has expired',
  INVALID_ORDER_AMOUNT: 'Invalid order amount',
  MAX_ITEMS_EXCEEDED: 'Maximum items per order exceeded',
  INSUFFICIENT_STOCK: 'Insufficient stock for order',
  PAYMENT_PROCESSING_FAILED: 'Payment processing failed',
  INVALID_PAYMENT_METHOD: 'Invalid payment method',
  INVALID_SHIPPING_ADDRESS: 'Invalid shipping address',
  INVALID_BILLING_ADDRESS: 'Invalid billing address',
} as const;

// ============================================
// Port Configuration
// ============================================
export const PORT = {
  HTTP: 3005,
} as const;

// ============================================
// Database Configuration
// ============================================
export const DB_CONFIG = {
  MAX_CONNECTIONS: 25,
  MIN_CONNECTIONS: 5,
  ACQUIRE_TIMEOUT: 60000,
  IDLE_TIMEOUT: 10000,
} as const;

// ============================================
// Redis Configuration
// ============================================
export const REDIS_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  CONNECT_TIMEOUT: 10000,
} as const;
