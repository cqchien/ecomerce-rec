// Export all API services
export { default as apiClient } from './client';
export type { ApiResponse, PaginatedResponse } from './client';

export { authService } from './auth.service';
export type {
  User,
  LoginCredentials,
  RegisterData,
  AuthResponse,
  ForgotPasswordData,
  ResetPasswordData,
} from './auth.service';

export { userService } from './user.service';
export type {
  UserProfile,
  Address,
  UserPreferences,
  WishlistItem,
  UpdateProfileData,
  AddAddressData,
} from './user.service';

export { productService } from './product.service';
export type {
  Product,
  Category,
  ProductReview,
  ProductFilters,
  AddReviewData,
} from './product.service';

export { cartService } from './cart.service';
export type {
  Cart,
  CartItem,
  AddToCartData,
  UpdateCartItemData,
} from './cart.service';

export { orderService } from './order.service';
export type {
  Order,
  OrderItem,
  OrderStatus,
  TrackingInfo,
  CreateOrderData,
} from './order.service';

export { checkoutService } from './checkout.service';
export type {
  CheckoutCalculation,
  PaymentIntent,
  CheckoutConfirmData,
  CheckoutConfirmation,
} from './checkout.service';
