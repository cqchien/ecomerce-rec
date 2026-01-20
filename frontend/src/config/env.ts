// Environment configuration
export const env = {
  // API Configuration
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',

  // Feature Flags
  enableRecommendations: import.meta.env.VITE_ENABLE_RECOMMENDATIONS !== 'false',

  // Third Party
  stripePublicKey: import.meta.env.VITE_STRIPE_PUBLIC_KEY || '',

  // App Configuration
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

// Type-safe environment access
export type Environment = typeof env;
