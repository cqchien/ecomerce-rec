// API Base URL Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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
    profile: '/users/profile',
    updateProfile: '/users/profile',
    addresses: '/users/addresses',
    addAddress: '/users/addresses',
    updateAddress: (id: string) => `/users/addresses/${id}`,
    deleteAddress: (id: string) => `/users/addresses/${id}`,
    preferences: '/users/preferences',
    wishlist: '/users/wishlist',
    addToWishlist: '/users/wishlist',
    removeFromWishlist: (productId: string) => `/users/wishlist/${productId}`,
  },

  // Products
  products: {
    list: '/products',
    detail: (id: string) => `/products/${id}`,
    bySlug: (slug: string) => `/products/slug/${slug}`,
    categories: '/products/categories',
    category: (id: string) => `/products/categories/${id}`,
    search: '/products/search',
    recommended: '/products/recommended',
    trending: '/products/trending',
    related: (id: string) => `/products/${id}/related`,
    reviews: (id: string) => `/products/${id}/reviews`,
    addReview: (id: string) => `/products/${id}/reviews`,
    trackView: (id: string) => `/products/${id}/view`,
    priceRange: '/products/price-range',
  },

  // Cart
  cart: {
    get: '/cart',
    applyCoupon: '/cart/coupon',
    removeCoupon: '/cart/coupon',
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
    paymentIntent: '/checkout/payment-intent',
    confirm: '/checkout/confirm',
  },
  
  // Recommendations (separate from products for clarity)
  recommendations: {
    personalized: '/products/recommended',
    trending: '/products/trending',
    similar: (productId: string) => `/products/${productId}/related`,
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
