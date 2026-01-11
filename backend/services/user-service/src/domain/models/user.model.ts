import { Address } from './address.model';
import { WishlistItem } from './wishlist-item.model';

/**
 * User domain model representing a user in the system.
 * Pure TypeScript class with no framework dependencies.
 */
export class User {
  constructor(
    public readonly id: string,
    public email: string,
    public name: string,
    public phone: string | null,
    public avatar: string | null,
    public readonly createdAt: Date,
    public updatedAt: Date,
    public deletedAt: Date | null,
    public addresses: Address[] = [],
    public wishlist: WishlistItem[] = [],
  ) {}

  /**
   * Update user profile information.
   */
  updateProfile(data: {
    name?: string;
    phone?: string;
    avatar?: string;
  }): void {
    if (data.name !== undefined) {
      this.name = data.name;
    }
    if (data.phone !== undefined) {
      this.phone = data.phone;
    }
    if (data.avatar !== undefined) {
      this.avatar = data.avatar;
    }
    this.updatedAt = new Date();
  }

  /**
   * Update user email address.
   */
  updateEmail(email: string): void {
    this.email = email;
    this.updatedAt = new Date();
  }

  /**
   * Soft delete user account.
   */
  softDelete(): void {
    this.deletedAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Restore soft-deleted user account.
   */
  restore(): void {
    this.deletedAt = null;
    this.updatedAt = new Date();
  }

  /**
   * Check if user is deleted.
   */
  isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  /**
   * Add address to user.
   */
  addAddress(address: Address): void {
    this.addresses.push(address);
    this.updatedAt = new Date();
  }

  /**
   * Remove address from user.
   */
  removeAddress(addressId: string): void {
    this.addresses = this.addresses.filter(addr => addr.id !== addressId);
    this.updatedAt = new Date();
  }

  /**
   * Get default address.
   */
  getDefaultAddress(): Address | null {
    return this.addresses.find(addr => addr.isDefault) || null;
  }

  /**
   * Add item to wishlist.
   */
  addToWishlist(item: WishlistItem): void {
    if (!this.isInWishlist(item.productId)) {
      this.wishlist.push(item);
    }
  }

  /**
   * Remove item from wishlist.
   */
  removeFromWishlist(productId: string): void {
    this.wishlist = this.wishlist.filter(item => item.productId !== productId);
  }

  /**
   * Check if product is in wishlist.
   */
  isInWishlist(productId: string): boolean {
    return this.wishlist.some(item => item.productId === productId);
  }

  /**
   * Clear entire wishlist.
   */
  clearWishlist(): void {
    this.wishlist = [];
  }

  /**
   * Validate user data.
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.email || !this.email.includes('@')) {
      errors.push('Invalid email address');
    }

    if (!this.name || this.name.trim().length === 0) {
      errors.push('Name is required');
    }

    if (this.phone && !/^\+?[\d\s-()]+$/.test(this.phone)) {
      errors.push('Invalid phone number format');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
