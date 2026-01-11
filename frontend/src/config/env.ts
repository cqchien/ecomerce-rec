// Environment configuration
export const env = {
  // API Configuration
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  useMockData: import.meta.env.VITE_USE_MOCK_DATA === 'true',

  // Feature Flags
  enableAIFeatures: import.meta.env.VITE_ENABLE_AI_FEATURES !== 'false',
  enableRecommendations: import.meta.env.VITE_ENABLE_RECOMMENDATIONS !== 'false',

  // Third Party
  googleApiKey: import.meta.env.VITE_GOOGLE_API_KEY || '',
  stripePublicKey: import.meta.env.VITE_STRIPE_PUBLIC_KEY || '',

  // App Configuration
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

// Type-safe environment access
export type Environment = typeof env;
