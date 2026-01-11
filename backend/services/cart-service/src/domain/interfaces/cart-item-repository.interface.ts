import { CartItem } from '../models/cart-item.model';

/**
 * Cart Item Repository Interface (Domain Layer)
 * Defines contract for cart item data access operations
 * Works with pure domain models, not TypeORM entities
 */
export interface ICartItemRepository {
  /**
   * Find cart item by ID
   */
  findById(id: string): Promise<CartItem | null>;

  /**
   * Find cart items by cart ID
   */
  findByCartId(cartId: string): Promise<CartItem[]>;

  /**
   * Save cart item
   */
  save(cartItem: CartItem): Promise<CartItem>;

  /**
   * Delete cart item by ID
   */
  delete(id: string): Promise<void>;

  /**
   * Delete all cart items by cart ID
   */
  deleteByCartId(cartId: string): Promise<void>;
}
