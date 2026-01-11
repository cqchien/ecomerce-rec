// API Endpoints Configuration
export const API_ENDPOINTS = {
  // Authentication
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    verifyEmail: '/auth/verify-email',
  },

  // User
  user: {
    profile: '/user/profile',
    updateProfile: '/user/profile',
    addresses: '/user/addresses',
    preferences: '/user/preferences',
    wishlist: '/user/wishlist',
  },

  // Products
  products: {
    list: '/products',
    detail: (id: string) => `/products/${id}`,
    categories: '/products/categories',
    search: '/products/search',
    recommended: '/products/recommended',
    trending: '/products/trending',
    related: (id: string) => `/products/${id}/related`,
    reviews: (id: string) => `/products/${id}/reviews`,
  },

  // Cart
  cart: {
    get: '/cart',
    add: '/cart/items',
    update: (itemId: string) => `/cart/items/${itemId}`,
    remove: (itemId: string) => `/cart/items/${itemId}`,
    clear: '/cart/clear',
  },

  // Orders
  orders: {
    create: '/orders',
    list: '/orders',
    detail: (id: string) => `/orders/${id}`,
    cancel: (id: string) => `/orders/${id}/cancel`,
  },

  // Checkout
  checkout: {
    calculate: '/checkout/calculate',
    createPaymentIntent: '/checkout/payment-intent',
    confirm: '/checkout/confirm',
  },

  // Admin
  admin: {
    dashboard: '/admin/dashboard',
    products: '/admin/products',
    orders: '/admin/orders',
    users: '/admin/users',
    analytics: '/admin/analytics',
  },
} as const;

// API Configuration
export const API_CONFIG = {
  timeout: 30000, // 30 seconds
  retries: 3,
  retryDelay: 1000, // 1 second
  headers: {
    'Content-Type': 'application/json',
  },
} as const;
