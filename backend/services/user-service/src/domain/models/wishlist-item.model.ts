/**
 * WishlistItem domain model representing a product in user's wishlist.
 * Pure TypeScript class with no framework dependencies.
 */
export class WishlistItem {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly productId: string,
    public readonly addedAt: Date,
  ) {}

  /**
   * Check if item was added recently (within 24 hours).
   */
  isRecentlyAdded(): boolean {
    const hoursSinceAdded = (Date.now() - this.addedAt.getTime()) / (1000 * 60 * 60);
    return hoursSinceAdded < 24;
  }

  /**
   * Check if item is old (added more than 30 days ago).
   */
  isOld(): boolean {
    const daysSinceAdded = (Date.now() - this.addedAt.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceAdded > 30;
  }

  /**
   * Get days since added.
   */
  getDaysSinceAdded(): number {
    return Math.floor((Date.now() - this.addedAt.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Validate wishlist item data.
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.userId || this.userId.trim().length === 0) {
      errors.push('User ID is required');
    }

    if (!this.productId || this.productId.trim().length === 0) {
      errors.push('Product ID is required');
    }

    if (this.addedAt > new Date()) {
      errors.push('Added date cannot be in the future');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
