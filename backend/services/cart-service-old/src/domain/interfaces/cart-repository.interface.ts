import { Cart } from '../models/cart.model';

/**
 * Cart Repository Interface (Domain Layer)
 * Defines contract for cart data access operations
 * Works with pure domain models, not TypeORM entities
 */
export interface ICartRepository {
  /**
   * Find cart by user ID
   */
  findByUserId(userId: string): Promise<Cart | null>;

  /**
   * Find cart by ID with relations
   */
  findById(id: string): Promise<Cart | null>;

  /**
   * Save cart
   */
  save(cart: Cart): Promise<Cart>;

  /**
   * Delete cart
   */
  delete(id: string): Promise<void>;

  /**
   * Find abandoned carts (inactive for specified days)
   */
  findAbandonedCarts(days: number): Promise<Cart[]>;

  /**
   * Find expired carts
   */
  findExpiredCarts(): Promise<Cart[]>;

  /**
   * Delete multiple carts
   */
  deleteMany(ids: string[]): Promise<void>;
}
