// Notification Types
export const NOTIFICATION_TYPES = {
  EMAIL: 'email',
  SMS: 'sms',
  PUSH: 'push',
  IN_APP: 'in_app',
} as const;

// Notification Channels
export const NOTIFICATION_CHANNELS = {
  ORDER: 'order',
  USER: 'user',
  PAYMENT: 'payment',
  MARKETING: 'marketing',
  SYSTEM: 'system',
  CART: 'cart',
  PRODUCT: 'product',
} as const;

// Notification Status
export const NOTIFICATION_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  FAILED: 'failed',
  QUEUED: 'queued',
  PROCESSING: 'processing',
  DELIVERED: 'delivered',
  BOUNCED: 'bounced',
  CANCELLED: 'cancelled',
} as const;

// Notification Priority
export const NOTIFICATION_PRIORITY = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

// Email Templates
export const EMAIL_TEMPLATES = {
  // User Templates
  WELCOME: 'welcome',
  EMAIL_VERIFICATION: 'email_verification',
  PASSWORD_RESET: 'password_reset',
  PASSWORD_CHANGED: 'password_changed',
  ACCOUNT_DELETED: 'account_deleted',

  // Order Templates
  ORDER_CONFIRMATION: 'order_confirmation',
  ORDER_SHIPPED: 'order_shipped',
  ORDER_DELIVERED: 'order_delivered',
  ORDER_CANCELLED: 'order_cancelled',
  ORDER_REFUNDED: 'order_refunded',

  // Payment Templates
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed',
  REFUND_PROCESSED: 'refund_processed',

  // Cart Templates
  CART_ABANDONED: 'cart_abandoned',
  CART_REMINDER: 'cart_reminder',

  // Marketing Templates
  PROMOTIONAL: 'promotional',
  NEWSLETTER: 'newsletter',
  PRODUCT_RECOMMENDATION: 'product_recommendation',
  FLASH_SALE: 'flash_sale',

  // System Templates
  LOW_STOCK_ALERT: 'low_stock_alert',
  PRICE_DROP_ALERT: 'price_drop_alert',
} as const;

// SMS Templates
export const SMS_TEMPLATES = {
  ORDER_CONFIRMATION: 'order_confirmation_sms',
  ORDER_SHIPPED: 'order_shipped_sms',
  ORDER_DELIVERED: 'order_delivered_sms',
  OTP_VERIFICATION: 'otp_verification',
  PAYMENT_SUCCESS: 'payment_success_sms',
  CART_REMINDER: 'cart_reminder_sms',
} as const;

// Push Notification Templates
export const PUSH_TEMPLATES = {
  ORDER_UPDATE: 'order_update_push',
  PAYMENT_UPDATE: 'payment_update_push',
  NEW_MESSAGE: 'new_message_push',
  PROMOTIONAL: 'promotional_push',
  PRICE_DROP: 'price_drop_push',
} as const;

// Event Topics (consumed from Event Service)
export const KAFKA_TOPICS = {
  // Order Events
  ORDER_CREATED: 'order.created',
  ORDER_CONFIRMED: 'order.confirmed',
  ORDER_SHIPPED: 'order.shipped',
  ORDER_DELIVERED: 'order.delivered',
  ORDER_CANCELLED: 'order.cancelled',

  // Payment Events
  PAYMENT_SUCCEEDED: 'payment.succeeded',
  PAYMENT_FAILED: 'payment.failed',
  PAYMENT_REFUNDED: 'payment.refunded',

  // User Events
  USER_REGISTERED: 'user.registered',
  USER_UPDATED: 'user.updated',
  PASSWORD_RESET_REQUESTED: 'user.password_reset_requested',

  // Cart Events
  CART_ABANDONED: 'cart.abandoned',

  // Inventory Events
  INVENTORY_LOW_STOCK: 'inventory.stock_low',

  // Product Events
  PRODUCT_PRICE_CHANGED: 'product.price_changed',
} as const;

// Kafka Consumer Group
export const KAFKA_CONSUMER_GROUP = 'notification-service-group';

// Redis Keys
export const REDIS_KEYS = {
  NOTIFICATION_QUEUE: 'notification:queue',
  NOTIFICATION_PROCESSING: 'notification:processing',
  NOTIFICATION_RETRY: 'notification:retry',
  RATE_LIMIT: 'notification:rate_limit',
  USER_PREFERENCES: 'notification:user:preferences',
  SENT_NOTIFICATIONS: 'notification:sent',
  FAILED_NOTIFICATIONS: 'notification:failed',
  TEMPLATE_CACHE: 'notification:template',
} as const;

// Cache TTL (in seconds)
export const CACHE_TTL = {
  USER_PREFERENCES: 3600, // 1 hour
  TEMPLATE: 7200, // 2 hours
  SENT_LOG: 86400, // 24 hours
  FAILED_LOG: 259200, // 3 days
  RATE_LIMIT: 60, // 1 minute
} as const;

// Retry Configuration
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  INITIAL_DELAY: 5000, // 5 seconds
  MAX_DELAY: 60000, // 60 seconds
  BACKOFF_MULTIPLIER: 2,
} as const;

// Rate Limiting
export const RATE_LIMITS = {
  EMAIL_PER_MINUTE: 100,
  SMS_PER_MINUTE: 50,
  PUSH_PER_MINUTE: 200,
  PER_USER_PER_HOUR: 10,
} as const;

// Batch Processing
export const BATCH_CONFIG = {
  SIZE: 100,
  TIMEOUT: 10000, // 10 seconds
  MAX_CONCURRENT: 5,
} as const;

// Provider Names
export const PROVIDERS = {
  SENDGRID: 'sendgrid',
  TWILIO: 'twilio',
  FIREBASE: 'firebase',
  NODEMAILER: 'nodemailer',
} as const;

// Notification Errors
export const ERRORS = {
  INVALID_RECIPIENT: 'Invalid recipient',
  INVALID_TEMPLATE: 'Invalid template',
  PROVIDER_ERROR: 'Provider error',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
  DELIVERY_FAILED: 'Delivery failed',
  TEMPLATE_RENDER_ERROR: 'Template render error',
  INVALID_NOTIFICATION_TYPE: 'Invalid notification type',
  USER_OPTED_OUT: 'User opted out of notifications',
  INVALID_PHONE_NUMBER: 'Invalid phone number',
  INVALID_EMAIL: 'Invalid email address',
} as const;

// Default Values
export const DEFAULTS = {
  NOTIFICATION_PRIORITY: NOTIFICATION_PRIORITY.NORMAL,
  NOTIFICATION_STATUS: NOTIFICATION_STATUS.PENDING,
  RETRY_COUNT: 0,
  BATCH_SIZE: 50,
  TIMEOUT: 30000, // 30 seconds
} as const;

// User Preference Defaults
export const USER_PREFERENCE_DEFAULTS = {
  EMAIL_ENABLED: true,
  SMS_ENABLED: true,
  PUSH_ENABLED: true,
  MARKETING_ENABLED: false,
  ORDER_UPDATES: true,
  PAYMENT_UPDATES: true,
  CART_REMINDERS: true,
  PRODUCT_RECOMMENDATIONS: false,
} as const;

// Port Configuration
export const PORT = {
  HTTP: 3008,
} as const;
