import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { cartService, type Cart, type CartItem as ApiCartItem } from '@/services';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  stock: number;
}

interface CartItem extends Product {
  quantity: number;
  selectedVariant?: string;
}

interface CartStore {
  items: CartItem[];
  cart: Cart | null;
  isLoading: boolean;
  addItem: (product: Product, quantity?: number, variant?: string) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  fetchCart: () => Promise<void>;
  getTotal: () => number;
  getItemCount: () => number;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      cart: null,
      isLoading: false,

      fetchCart: async () => {
        try {
          // Check if user is authenticated by checking for access token
          const token = localStorage.getItem('access_token');
          if (!token) {
            // User not authenticated, clear cart
            set({ cart: null, items: [], isLoading: false });
            return;
          }
          
          set({ isLoading: true });
          const cart = await cartService.getCart();
          
          // Transform API cart items to local format
          const items = cart.items.map((item: ApiCartItem) => ({
            id: item.productId,
            name: item.name,
            price: item.unitPrice,
            image: item.image,
            quantity: item.quantity,
            category: '', // Not provided by API
            stock: 0, // Not provided by API
            selectedVariant: item.variantId,
          }));
          
          set({ cart, items, isLoading: false });
        } catch (error: any) {
          console.error('Failed to fetch cart:', error);
          // If unauthorized or forbidden, clear cart data
          if (error?.status === 401 || error?.status === 403) {
            set({ cart: null, items: [], isLoading: false });
          } else {
            set({ isLoading: false });
          }
        }
      },

      addItem: async (product: Product, quantity = 1, variant?: string) => {
        try {
          set({ isLoading: true });
          const cart = await cartService.addToCart({
            productId: product.id,
            variantId: variant,
            quantity,
          });
          
          // Transform API cart items to local format
          const items = cart.items.map((item: ApiCartItem) => ({
            id: item.productId,
            name: item.name,
            price: item.unitPrice,
            image: item.image,
            quantity: item.quantity,
            category: product.category || '',
            stock: product.stock || 0,
            selectedVariant: item.variantId,
          }));
          
          set({ cart, items, isLoading: false });
        } catch (error) {
          console.error('Failed to add item to cart:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      removeItem: async (productId: string) => {
        try {
          set({ isLoading: true });
          const currentCart = get().cart;
          const item = currentCart?.items.find((item: ApiCartItem) => item.productId === productId);
          
          if (item) {
            const cart = await cartService.removeCartItem(item.id);
            
            const items = cart.items.map((item: ApiCartItem) => ({
              id: item.productId,
              name: item.name,
              price: item.unitPrice,
              image: item.image,
              quantity: item.quantity,
              category: '',
              stock: 0,
              selectedVariant: item.variantId,
            }));
            
            set({ cart, items, isLoading: false });
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          console.error('Failed to remove item from cart:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      updateQuantity: async (productId: string, quantity: number) => {
        try {
          set({ isLoading: true });
          const currentCart = get().cart;
          const item = currentCart?.items.find((item: ApiCartItem) => item.productId === productId);
          
          if (item) {
            const cart = await cartService.updateCartItem(item.id, { quantity });
            
            const items = cart.items.map((item: ApiCartItem) => ({
              id: item.productId,
              name: item.name,
              price: item.unitPrice,
              image: item.image,
              quantity: item.quantity,
              category: '',
              stock: 0,
              selectedVariant: item.variantId,
            }));
            
            set({ cart, items, isLoading: false });
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          console.error('Failed to update cart item quantity:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      clearCart: async () => {
        try {
          set({ isLoading: true });
          await cartService.clearCart();
          set({ items: [], cart: null, isLoading: false });
        } catch (error) {
          console.error('Failed to clear cart:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      applyCoupon: async (code: string) => {
        try {
          set({ isLoading: true });
          const cart = await cartService.applyCoupon(code);
          
          const items = cart.items.map((item: ApiCartItem) => ({
            id: item.productId,
            name: item.name,
            price: item.unitPrice,
            image: item.image,
            quantity: item.quantity,
            category: '',
            stock: 0,
            selectedVariant: item.variantId,
          }));
          
          set({ cart, items, isLoading: false });
        } catch (error) {
          console.error('Failed to apply coupon:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      removeCoupon: async () => {
        try {
          set({ isLoading: true });
          const cart = await cartService.removeCoupon();
          
          const items = cart.items.map((item: ApiCartItem) => ({
            id: item.productId,
            name: item.name,
            price: item.unitPrice,
            image: item.image,
            quantity: item.quantity,
            category: '',
            stock: 0,
            selectedVariant: item.variantId,
          }));
          
          set({ cart, items, isLoading: false });
        } catch (error) {
          console.error('Failed to remove coupon:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      getTotal: () => {
        const cart = get().cart;
        return cart ? cart.total : 0;
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);
