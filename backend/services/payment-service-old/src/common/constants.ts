// ============================================
// Payment Status Constants
// ============================================
export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  REQUIRES_ACTION = 'REQUIRES_ACTION',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
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
// Payment Provider Constants
// ============================================
export enum PaymentProvider {
  STRIPE = 'STRIPE',
  PAYPAL = 'PAYPAL',
  MANUAL = 'MANUAL',
}

// ============================================
// Refund Status Constants
// ============================================
export enum RefundStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

// ============================================
// Refund Reason Constants
// ============================================
export enum RefundReason {
  CUSTOMER_REQUEST = 'CUSTOMER_REQUEST',
  FRAUDULENT = 'FRAUDULENT',
  DUPLICATE = 'DUPLICATE',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  PRODUCT_DEFECTIVE = 'PRODUCT_DEFECTIVE',
  PRODUCT_NOT_RECEIVED = 'PRODUCT_NOT_RECEIVED',
  OTHER = 'OTHER',
}

// ============================================
// Payment Event Types (Deprecated - use KAFKA_TOPICS)
// ============================================
export enum PaymentEventType {
  PAYMENT_INITIATED = 'payment.initiated',
  PAYMENT_PROCESSING = 'payment.processing',
  PAYMENT_SUCCEEDED = 'payment.succeeded',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_CANCELLED = 'payment.cancelled',
  REFUND_INITIATED = 'refund.initiated',
  REFUND_PROCESSING = 'refund.processing',
  REFUND_SUCCEEDED = 'refund.succeeded',
  REFUND_FAILED = 'refund.failed',
}

// ============================================
// Kafka Topics
// ============================================
export const KAFKA_TOPICS = {
  PAYMENT_INITIATED: 'payment.initiated',
  PAYMENT_PROCESSING: 'payment.processing',
  PAYMENT_SUCCEEDED: 'payment.succeeded',
  PAYMENT_FAILED: 'payment.failed',
  PAYMENT_CANCELLED: 'payment.cancelled',
  REFUND_INITIATED: 'refund.initiated',
  REFUND_PROCESSING: 'refund.processing',
  REFUND_SUCCEEDED: 'refund.succeeded',
  REFUND_FAILED: 'refund.failed',
} as const;

// ============================================
// Cache Configuration
// ============================================
export const CACHE_KEYS = {
  PAYMENT_BY_ID: 'payment:id:',
  PAYMENT_BY_ORDER: 'payment:order:',
  PAYMENTS_BY_USER: 'payments:user:',
  REFUND_BY_ID: 'refund:id:',
} as const;

export const CACHE_TTL = {
  PAYMENT: 300, // 5 minutes
  PAYMENT_LIST: 180, // 3 minutes
  REFUND: 600, // 10 minutes
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
// Payment Business Rules
// ============================================
export const PAYMENT_RULES = {
  MIN_AMOUNT: 0.5, // Minimum payment amount (in main currency units)
  MAX_AMOUNT: 999999.99, // Maximum payment amount
  REFUND_WINDOW_DAYS: 30, // Days within which refund can be requested
  PAYMENT_TIMEOUT_MINUTES: 30, // Payment session timeout
  MAX_REFUND_ATTEMPTS: 3,
  WEBHOOK_RETRY_ATTEMPTS: 3,
  WEBHOOK_RETRY_DELAY: 5000, // 5 seconds
} as const;

// ============================================
// Decimal Precision
// ============================================
export const DECIMAL_PRECISION = {
  AMOUNT: 2,
  CURRENCY_RATE: 4,
} as const;

// ============================================
// Supported Currencies
// ============================================
export const SUPPORTED_CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'AUD',
  'CAD',
  'CHF',
  'CNY',
  'HKD',
  'SGD',
] as const;

export type Currency = typeof SUPPORTED_CURRENCIES[number];

// ============================================
// Error Messages
// ============================================
export const ERROR_MESSAGES = {
  PAYMENT_NOT_FOUND: 'Payment not found',
  REFUND_NOT_FOUND: 'Refund not found',
  INVALID_PAYMENT_AMOUNT: 'Invalid payment amount',
  INVALID_CURRENCY: 'Invalid or unsupported currency',
  PAYMENT_ALREADY_PROCESSED: 'Payment has already been processed',
  PAYMENT_ALREADY_REFUNDED: 'Payment has already been refunded',
  REFUND_AMOUNT_EXCEEDS: 'Refund amount exceeds payment amount',
  REFUND_WINDOW_EXPIRED: 'Refund window has expired',
  PAYMENT_PROVIDER_ERROR: 'Payment provider error occurred',
  INSUFFICIENT_FUNDS: 'Insufficient funds',
  INVALID_PAYMENT_METHOD: 'Invalid payment method',
  PAYMENT_CANCELLED: 'Payment was cancelled',
  PAYMENT_FAILED: 'Payment processing failed',
} as const;

// ============================================
// Port Configuration
// ============================================
export const PORT = {
  HTTP: 3006,
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

// ============================================
// Stripe Configuration
// ============================================
export const STRIPE_CONFIG = {
  API_VERSION: '2023-10-16',
  WEBHOOK_TOLERANCE: 300, // 5 minutes
} as const;
