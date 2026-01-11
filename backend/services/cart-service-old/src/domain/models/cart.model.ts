import { CartItem } from './cart-item.model';

/**
 * Cart Domain Model (Pure TypeScript)
 * NO framework dependencies - follows clean architecture
 */
export class Cart {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public subtotal: number,
    public discount: number,
    public total: number,
    public items: CartItem[],
    public isAbandoned: boolean = false,
    public couponCode: string | null = null,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}

  /**
   * Calculate and update cart totals based on items
   */
  calculateTotals(): void {
    this.subtotal = this.roundPrice(
      this.items.reduce((sum, item) => sum + item.totalPrice, 0)
    );
    
    if (!this.couponCode) {
      this.discount = 0;
    }
    
    this.total = this.roundPrice(this.subtotal - this.discount);
  }

  /**
   * Apply discount from coupon
   */
  applyDiscount(discountAmount: number): void {
    this.discount = this.roundPrice(discountAmount);
    this.total = this.roundPrice(this.subtotal - this.discount);
  }

  /**
   * Remove coupon and reset discount
   */
  removeCoupon(): void {
    this.couponCode = null;
    this.discount = 0;
    this.calculateTotals();
  }

  /**
   * Reset cart to empty state
   */
  reset(): void {
    this.subtotal = 0;
    this.discount = 0;
    this.total = 0;
    this.couponCode = null;
    this.items = [];
  }

  /**
   * Mark cart as abandoned
   */
  markAsAbandoned(): void {
    this.isAbandoned = true;
  }

  /**
   * Check if cart is empty
   */
  isEmpty(): boolean {
    return this.items.length === 0;
  }

  /**
   * Check if cart has items
   */
  hasItems(): boolean {
    return this.items.length > 0;
  }

  /**
   * Get total item count
   */
  getItemCount(): number {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  /**
   * Find item by product and variant
   */
  findItem(productId: string, variantId?: string): CartItem | undefined {
    return this.items.find(item => item.matches(productId, variantId));
  }

  /**
   * Add item to cart
   */
  addItem(item: CartItem): void {
    const existing = this.findItem(item.productId, item.variantId);
    if (existing) {
      existing.addQuantity(item.quantity);
    } else {
      this.items.push(item);
    }
    this.calculateTotals();
  }

  /**
   * Remove item from cart
   */
  removeItem(itemId: string): CartItem | null {
    const index = this.items.findIndex(item => item.id === itemId);
    if (index === -1) {
      return null;
    }
    const removed = this.items.splice(index, 1)[0];
    this.calculateTotals();
    return removed;
  }

  /**
   * Update item quantity
   */
  updateItemQuantity(itemId: string, quantity: number): void {
    const item = this.items.find(i => i.id === itemId);
    if (item) {
      item.updateQuantity(quantity);
      this.calculateTotals();
    }
  }

  private roundPrice(value: number): number {
    return Number(value.toFixed(2));
  }
}
