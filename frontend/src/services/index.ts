import { env } from '@/config/env';
import { mockProductService } from './mock/products';
import { mockAuthService } from './mock/auth';
import { mockOrderService } from './mock/orders';

// Service factory - switches between mock and real API based on env
export const getProductService = () => {
  return mockProductService;
  // When API is ready: return env.useMockData ? mockProductService : apiProductService;
};

export const getAuthService = () => {
  return mockAuthService;
};

export const getOrderService = () => {
  return mockOrderService;
};

// Export services for direct use
export { mockProductService, mockAuthService, mockOrderService };
