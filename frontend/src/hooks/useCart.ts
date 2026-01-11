import { useCartStore } from '@/stores/cartStore';

/**
 * Custom hook for cart operations
 * Encapsulates cart business logic and calculations
 */
export const useCart = () => {
  const { items, updateQuantity, removeItem, getTotal, getItemCount, clearCart } = useCartStore();

  const subtotal = getTotal();
  const shipping = subtotal > 50 ? 0 : 5.99;
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + shipping + tax;

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  return {
    // State
    items,
    itemCount: getItemCount(),
    isEmpty: items.length === 0,

    // Calculations
    subtotal,
    shipping,
    tax,
    total,

    // Actions
    handleQuantityChange,
    removeItem,
    clearCart,
  };
};
