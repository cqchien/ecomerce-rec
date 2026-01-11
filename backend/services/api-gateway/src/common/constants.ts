// ============================================
// Service URLs
// ============================================
export const SERVICE_URLS = {
  PRODUCT_SERVICE: process.env.PRODUCT_SERVICE_URL || 'http://localhost:50051',
  INVENTORY_SERVICE: process.env.INVENTORY_SERVICE_URL || 'http://localhost:50052',
  USER_SERVICE: process.env.USER_SERVICE_URL || 'http://localhost:3003',
  CART_SERVICE: process.env.CART_SERVICE_URL || 'http://localhost:3004',
  ORDER_SERVICE: process.env.ORDER_SERVICE_URL || 'http://localhost:3005',
  PAYMENT_SERVICE: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3006',
} as const;

// ============================================
// Route Prefixes
// ============================================
export const ROUTE_PREFIXES = {
  PRODUCTS: '/products',
  INVENTORY: '/inventory',
  USERS: '/users',
  CART: '/cart',
  ORDERS: '/orders',
  PAYMENTS: '/payments',
  AUTH: '/auth',
} as const;

// ============================================
// Cache Configuration
// ============================================
export const CACHE_KEYS = {
  USER_SESSION: 'session:user:',
  RATE_LIMIT: 'rate:limit:',
} as const;

export const CACHE_TTL = {
  USER_SESSION: 3600, // 1 hour
  RATE_LIMIT: 60, // 1 minute
} as const;

// ============================================
// Rate Limiting
// ============================================
export const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100, // Max requests per window
  AUTH_WINDOW_MS: 15 * 60 * 1000,
  AUTH_MAX_REQUESTS: 5, // Max login attempts
  PAYMENT_WINDOW_MS: 60 * 1000,
  PAYMENT_MAX_REQUESTS: 10,
} as const;

// ============================================
// JWT Configuration
// ============================================
export const JWT_CONFIG = {
  SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  EXPIRES_IN: '7d',
  REFRESH_EXPIRES_IN: '30d',
} as const;

// ============================================
// Timeout Configuration
// ============================================
export const TIMEOUT = {
  DEFAULT_REQUEST: 30000, // 30 seconds
  PAYMENT_REQUEST: 60000, // 60 seconds for payment operations
  FILE_UPLOAD: 120000, // 2 minutes for file uploads
} as const;

// ============================================
// Request Size Limits
// ============================================
export const REQUEST_LIMITS = {
  JSON_PAYLOAD: '10mb',
  URL_ENCODED: '10mb',
  FILE_UPLOAD: '50mb',
} as const;

// ============================================
// Error Messages
// ============================================
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Forbidden resource',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
  RATE_LIMIT_EXCEEDED: 'Too many requests, please try again later',
  INVALID_TOKEN: 'Invalid or expired token',
  GATEWAY_TIMEOUT: 'Gateway timeout',
  BAD_GATEWAY: 'Bad gateway',
} as const;

// ============================================
// HTTP Status Codes
// ============================================
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

// ============================================
// Port Configuration
// ============================================
export const PORT = {
  HTTP: 3000,
} as const;

// ============================================
// CORS Configuration
// ============================================
export const CORS_CONFIG = {
  ORIGIN: process.env.CORS_ORIGIN || '*',
  CREDENTIALS: true,
  METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  ALLOWED_HEADERS: ['Content-Type', 'Authorization', 'X-Requested-With'],
  EXPOSED_HEADERS: ['X-Total-Count', 'X-Page', 'X-Page-Size'],
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
// Health Check
// ============================================
export const HEALTH_CHECK = {
  INTERVAL_MS: 30000, // Check every 30 seconds
  TIMEOUT_MS: 5000, // 5 seconds timeout
} as const;

// ============================================
// Logging
// ============================================
export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
} as const;

// ============================================
// Public Routes (no auth required)
// ============================================
export const PUBLIC_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/health',
  '/api/products',
  '/api/products/:id',
] as const;
