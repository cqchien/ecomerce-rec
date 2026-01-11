// Pagination Constants
export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const MIN_PAGE_SIZE = 1;

// Cache TTL Constants (in seconds)
export const USER_CACHE_TTL = 3600; // 1 hour
export const PREFERENCES_CACHE_TTL = 7200; // 2 hours
export const WISHLIST_CACHE_TTL = 1800; // 30 minutes
export const ADDRESS_CACHE_TTL = 3600; // 1 hour

// Cache Key Prefixes
export const CACHE_KEY_USER = 'user:';
export const CACHE_KEY_PREFERENCES = 'preferences:';
export const CACHE_KEY_WISHLIST = 'wishlist:';
export const CACHE_KEY_ADDRESS = 'address:';
export const CACHE_KEY_ADDRESSES = 'addresses:';

// Database Connection Pool
export const DB_MAX_CONNECTIONS = 25;
export const DB_MIN_CONNECTIONS = 5;
export const DB_IDLE_TIMEOUT = 300000; // 5 minutes

// Server Ports
export const DEFAULT_GRPC_PORT = 5001;
export const DEFAULT_HTTP_PORT = 5002;

// Graceful Shutdown
export const GRACEFUL_SHUTDOWN_TIMEOUT = 30000; // 30 seconds

// Default Values
export const DEFAULT_LANGUAGE = 'en';
export const DEFAULT_CURRENCY = 'USD';
export const DEFAULT_EMAIL_NOTIFICATIONS = true;
export const DEFAULT_SMS_NOTIFICATIONS = false;
export const DEFAULT_MARKETING_EMAILS = false;

// Validation Constants
export const MIN_NAME_LENGTH = 2;
export const MAX_NAME_LENGTH = 100;
export const MAX_PHONE_LENGTH = 20;
export const MAX_ADDRESS_LINE_LENGTH = 255;
export const MAX_CITY_LENGTH = 100;
export const MAX_STATE_LENGTH = 100;
export const MAX_POSTAL_CODE_LENGTH = 20;
export const MAX_COUNTRY_LENGTH = 100;
