// ============================================
// Event Topics
// ============================================
export const TOPICS = {
  // Order Events
  ORDER_CREATED: 'order.created',
  ORDER_CONFIRMED: 'order.confirmed',
  ORDER_CANCELLED: 'order.cancelled',
  ORDER_SHIPPED: 'order.shipped',
  ORDER_DELIVERED: 'order.delivered',
  
  // Payment Events
  PAYMENT_INITIATED: 'payment.initiated',
  PAYMENT_SUCCEEDED: 'payment.succeeded',
  PAYMENT_FAILED: 'payment.failed',
  REFUND_INITIATED: 'refund.initiated',
  REFUND_COMPLETED: 'refund.completed',
  
  // User Events
  USER_REGISTERED: 'user.registered',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  
  // Cart Events
  CART_UPDATED: 'cart.updated',
  CART_ABANDONED: 'cart.abandoned',
  
  // Product Events
  PRODUCT_CREATED: 'product.created',
  PRODUCT_UPDATED: 'product.updated',
  PRODUCT_DELETED: 'product.deleted',
  
  // Inventory Events
  STOCK_UPDATED: 'inventory.stock_updated',
  STOCK_LOW: 'inventory.stock_low',
  STOCK_OUT: 'inventory.stock_out',
} as const;

// ============================================
// Consumer Groups
// ============================================
export const CONSUMER_GROUPS = {
  NOTIFICATION_SERVICE: 'notification-service-group',
  ANALYTICS_SERVICE: 'analytics-service-group',
  EMAIL_SERVICE: 'email-service-group',
  RECOMMENDATION_SERVICE: 'recommendation-service-group',
  AUDIT_SERVICE: 'audit-service-group',
} as const;

// ============================================
// Event Priority
// ============================================
export enum EventPriority {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

// ============================================
// Event Status
// ============================================
export enum EventStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED',
  RETRYING = 'RETRYING',
}

// ============================================
// Kafka Configuration
// ============================================
export const KAFKA_CONFIG = {
  CLIENT_ID: 'event-service',
  BROKERS: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  CONNECTION_TIMEOUT: 30000,
  REQUEST_TIMEOUT: 30000,
  RETRY: {
    RETRIES: 5,
    INITIAL_RETRY_TIME: 300,
    MAX_RETRY_TIME: 30000,
  },
  LOG_LEVEL: 2, // ERROR
} as const;

// ============================================
// Producer Configuration
// ============================================
export const PRODUCER_CONFIG = {
  ALLOW_AUTO_TOPIC_CREATION: true,
  TRANSACTION_TIMEOUT: 30000,
  MAX_IN_FLIGHT_REQUESTS: 5,
  IDEMPOTENT: true,
  COMPRESSION_TYPE: 'gzip' as const,
  ACKS: -1, // All replicas must acknowledge
} as const;

// ============================================
// Consumer Configuration
// ============================================
export const CONSUMER_CONFIG = {
  SESSION_TIMEOUT: 30000,
  HEARTBEAT_INTERVAL: 3000,
  REBALANCE_TIMEOUT: 60000,
  MAX_BYTES_PER_PARTITION: 1048576, // 1MB
  FROM_BEGINNING: false,
  AUTO_COMMIT: false, // Manual commit for better control
  AUTO_COMMIT_INTERVAL: 5000,
} as const;

// ============================================
// Retry Configuration
// ============================================
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 5000, // 5 seconds
  BACKOFF_MULTIPLIER: 2,
  MAX_RETRY_DELAY: 60000, // 1 minute
} as const;

// ============================================
// Cache Configuration
// ============================================
export const CACHE_KEYS = {
  EVENT_PROCESSED: 'event:processed:',
  FAILED_EVENT: 'event:failed:',
  EVENT_STATS: 'event:stats',
} as const;

export const CACHE_TTL = {
  EVENT_PROCESSED: 3600, // 1 hour
  FAILED_EVENT: 86400, // 24 hours
  EVENT_STATS: 300, // 5 minutes
} as const;

// ============================================
// Dead Letter Queue
// ============================================
export const DLQ_CONFIG = {
  TOPIC_SUFFIX: '.dlq',
  MAX_RETRIES: 3,
  RETENTION_MS: 604800000, // 7 days
} as const;

// ============================================
// Error Messages
// ============================================
export const ERROR_MESSAGES = {
  KAFKA_CONNECTION_FAILED: 'Failed to connect to Kafka',
  PRODUCER_INIT_FAILED: 'Failed to initialize Kafka producer',
  CONSUMER_INIT_FAILED: 'Failed to initialize Kafka consumer',
  MESSAGE_SEND_FAILED: 'Failed to send message',
  MESSAGE_PROCESS_FAILED: 'Failed to process message',
  INVALID_EVENT_FORMAT: 'Invalid event format',
  TOPIC_NOT_FOUND: 'Topic not found',
} as const;

// ============================================
// Port Configuration
// ============================================
export const PORT = {
  HTTP: 3007,
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
// Monitoring
// ============================================
export const MONITORING = {
  METRICS_INTERVAL: 60000, // 1 minute
  HEALTH_CHECK_INTERVAL: 30000, // 30 seconds
} as const;

// ============================================
// Event Schema Version
// ============================================
export const EVENT_SCHEMA_VERSION = '1.0.0';

// ============================================
// Batch Processing
// ============================================
export const BATCH_CONFIG = {
  BATCH_SIZE: 100,
  BATCH_TIMEOUT: 10000, // 10 seconds
} as const;
