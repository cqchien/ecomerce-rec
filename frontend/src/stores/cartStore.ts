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
            category: 'product', // Default category
            stock: 999, // Default high stock to avoid stock warnings
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
          
          // Ensure price is a valid number - must be positive
          const productPrice = Number(product.price) || 0;
          const productStock = Number(product.stock) || 0;
          
          if (productPrice === 0) {
            console.error('Error: Cannot add product with $0 price:', product);
            throw new Error('Product price is not available. Please refresh the page and try again.');
          }
          
          if (productStock === 0) {
            throw new Error('Product is out of stock');
          }
          
          const cart = await cartService.addToCart({
            productId: product.id,
            variantId: variant,
            quantity,
            name: product.name,
            image: product.image,
            sku: product.id,
            price: productPrice,
            currency: 'USD',
          });
          
          // Transform API cart items to local format
          // Keep existing stock values for items already in cart, use product stock for new/updated item
          const existingItems = get().items;
          const items = cart.items.map((item: ApiCartItem) => {
            const existingItem = existingItems.find(ei => ei.id === item.productId);
            return {
              id: item.productId,
              name: item.name,
              price: item.unitPrice,
              image: item.image,
              quantity: item.quantity,
              category: item.productId === product.id ? (product.category || 'product') : (existingItem?.category || 'product'),
              stock: item.productId === product.id ? productStock : (existingItem?.stock || 999),
              selectedVariant: item.variantId,
            };
          });
          
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
              category: 'product',
              stock: 999,
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
          
          console.log('UpdateQuantity - Looking for productId:', productId);
          console.log('UpdateQuantity - Found cart item:', item);
          console.log('UpdateQuantity - All cart items:', currentCart?.items);
          
          if (item) {
            const cart = await cartService.updateCartItem(item.id, { quantity });
            
            const items = cart.items.map((item: ApiCartItem) => ({
              id: item.productId,
              name: item.name,
              price: item.unitPrice,
              image: item.image,
              quantity: item.quantity,
              category: 'product',
              stock: 999,
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
        const total = cart?.total;
        return Number(total) || 0;
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
