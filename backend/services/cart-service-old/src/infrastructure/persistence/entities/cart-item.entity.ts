import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { CartEntity } from './cart.entity';

/**
 * Cart Item TypeORM Entity (Infrastructure Layer)
 * Maps domain CartItem model to database
 */
@Entity('cart_items')
@Index(['cartId', 'productId', 'variantId'], { unique: true })
export class CartItemEntity {
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

  @ManyToOne(() => CartEntity, cart => cart.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cart_id' })
  cart: CartEntity;
}
