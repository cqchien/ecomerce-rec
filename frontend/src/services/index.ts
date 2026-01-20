import { productService } from './api/product.service';
import { authService } from './api/auth.service';
import { orderService } from './api/order.service';

// Service getters - always return real API services
export const getProductService = () => productService;
export const getAuthService = () => authService;
export const getOrderService = () => orderService;

// Export all API services for direct use
export * from './api';
