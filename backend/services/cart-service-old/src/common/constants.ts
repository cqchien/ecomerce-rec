// Pagination Constants
export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const MIN_PAGE_SIZE = 1;

// Cache TTL Constants (in seconds)
export const CART_CACHE_TTL = 1800; // 30 minutes
export const CART_ITEM_CACHE_TTL = 1800; // 30 minutes

// Cache Key Prefixes
export const CACHE_KEY_CART = 'cart:';
export const CACHE_KEY_CART_ITEMS = 'cart_items:';
export const CACHE_KEY_USER_CART = 'user_cart:';

// Database Connection Pool
export const DB_MAX_CONNECTIONS = 25;
export const DB_MIN_CONNECTIONS = 5;
export const DB_IDLE_TIMEOUT = 300000; // 5 minutes

// Server Ports
export const DEFAULT_HTTP_PORT = 5003;

// Graceful Shutdown
export const GRACEFUL_SHUTDOWN_TIMEOUT = 30000; // 30 seconds

// Cart Expiry
export const CART_EXPIRY_DAYS = 30; // Delete abandoned carts after 30 days
export const CART_ABANDONMENT_HOURS = 24; // Mark cart as abandoned after 24 hours

// Quantity Limits
export const MIN_QUANTITY = 1;
export const MAX_QUANTITY = 99;
export const MAX_CART_ITEMS = 50;

// Price Precision
export const PRICE_DECIMAL_PLACES = 2;

// Kafka Topics for Event-Driven Communication
export const KAFKA_TOPICS = {
  // Cart Events
  CART_ITEM_ADDED: 'cart.item_added',
  CART_ITEM_UPDATED: 'cart.item_updated',
  CART_ITEM_REMOVED: 'cart.item_removed',
  CART_ABANDONED: 'cart.abandoned',
  CART_CHECKOUT_STARTED: 'cart.checkout_started',
  CART_CLEARED: 'cart.cleared',
  CART_MERGED: 'cart.merged',
} as const;
