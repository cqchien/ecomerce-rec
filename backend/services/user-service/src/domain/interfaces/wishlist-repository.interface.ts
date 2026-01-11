import { WishlistItem } from '../models/wishlist-item.model';

/**
 * Repository interface for WishlistItem domain model.
 * Defines contract for wishlist persistence operations.
 */
export interface IWishlistRepository {
  /**
   * Find wishlist item by ID.
   */
  findById(id: string): Promise<WishlistItem | null>;

  /**
   * Find all wishlist items for a user.
   */
  findByUserId(userId: string): Promise<WishlistItem[]>;

  /**
   * Find wishlist item by user and product.
   */
  findByUserAndProduct(userId: string, productId: string): Promise<WishlistItem | null>;

  /**
   * Save wishlist item (create or update).
   */
  save(item: WishlistItem): Promise<WishlistItem>;

  /**
   * Delete wishlist item by ID.
   */
  delete(id: string): Promise<void>;

  /**
   * Delete wishlist item by user and product.
   */
  deleteByUserAndProduct(userId: string, productId: string): Promise<void>;

  /**
   * Delete all wishlist items for a user.
   */
  deleteByUserId(userId: string): Promise<void>;

  /**
   * Check if product is in user's wishlist.
   */
  isInWishlist(userId: string, productId: string): Promise<boolean>;

  /**
   * Count wishlist items for a user.
   */
  countByUserId(userId: string): Promise<number>;
}
