// Custom Hooks - Clean Exports
export { useCart } from './useCart';
export { useCheckout } from './useCheckout';
export type { CheckoutStep, ShippingInfo, PaymentInfo } from './useCheckout';

// Products hooks
export {
  useProducts,
  useProduct,
  useCategories,
  useFeaturedProducts,
  useRecommendedProducts,
  useRelatedProducts,
} from './useProducts';

// Orders hooks
export { useOrders, useOrder, useCancelOrder } from './useOrders';
