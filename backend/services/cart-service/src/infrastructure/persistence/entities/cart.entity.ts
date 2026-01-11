import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToMany, Index } from 'typeorm';
import { CartItemEntity } from './cart-item.entity';

/**
 * Cart TypeORM Entity (Infrastructure Layer)
 * Maps domain Cart model to database
 */
@Entity('carts')
@Index(['userId'])
export class CartEntity {
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

  @OneToMany(() => CartItemEntity, item => item.cart, { cascade: true, eager: true })
  items: CartItemEntity[];
}
