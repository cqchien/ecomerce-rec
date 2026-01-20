import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('wishlist_items')
@Index(['userId', 'productId'], { unique: true })
export class WishlistItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Column({ name: 'product_id' })
  @Index()
  productId: string;

  @CreateDateColumn({ name: 'added_at' })
  addedAt: Date;

  @ManyToOne(() => UserEntity, user => user.wishlist)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}
