import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Cart } from './cart.entity';

const PRICE_DECIMAL_PLACES = 2;

/**
 * Cart Item Entity (Domain Layer)
 * Contains business logic for cart item operations
 */
@Entity('cart_items')
@Index(['cartId', 'productId', 'variantId'], { unique: true })
export class CartItem {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'cart_id' })
  @Index()
  cartId: string;

  @Column({ name: 'product_id' })
  @Index()
  productId: string;

  @Column({ name: 'variant_id', nullable: true })
  variantId: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  image: string;

  @Column({ nullable: true })
  sku: string;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2 })
  unitPrice: number;

  @Column({ name: 'total_price', type: 'decimal', precision: 10, scale: 2 })
  totalPrice: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Cart, cart => cart.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cart_id' })
  cart: Cart;

  /**
   * Update quantity and recalculate total price
   */
  updateQuantity(newQuantity: number): void {
    this.quantity = newQuantity;
    this.calculateTotalPrice();
  }

  /**
   * Add to quantity
   */
  addQuantity(amount: number): void {
    this.quantity += amount;
    this.calculateTotalPrice();
  }

  /**
   * Calculate total price based on quantity and unit price
   */
  calculateTotalPrice(): void {
    this.totalPrice = this.roundPrice(this.quantity * Number(this.unitPrice));
  }

  /**
   * Check if item matches product and variant
   */
  matches(productId: string, variantId?: string): boolean {
    return this.productId === productId && 
           (this.variantId || '') === (variantId || '');
  }

  private roundPrice(value: number): number {
    return Number(value.toFixed(PRICE_DECIMAL_PLACES));
  }
}
