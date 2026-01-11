import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToMany, Index } from 'typeorm';
import { CartItem } from './cart-item.entity';

const PRICE_DECIMAL_PLACES = 2;

/**
 * Cart Entity (Domain Layer)
 * Contains business logic for cart operations
 */
@Entity('carts')
@Index(['userId'])
export class Cart {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  @Column({ name: 'is_abandoned', default: false })
  isAbandoned: boolean;

  @Column({ name: 'coupon_code', nullable: true })
  couponCode: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;

  @OneToMany(() => CartItem, item => item.cart, { cascade: true, eager: true })
  items: CartItem[];

  /**
   * Calculate and update cart totals based on items
   */
  calculateTotals(): void {
    this.subtotal = this.roundPrice(
      this.items.reduce((sum, item) => sum + Number(item.totalPrice), 0)
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
    return this.items.find(
      item => item.productId === productId && 
              (item.variantId || '') === (variantId || '')
    );
  }

  private roundPrice(value: number): number {
    return Number(value.toFixed(PRICE_DECIMAL_PLACES));
  }
}
