import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { PaymentStatus, PaymentMethod, PaymentProvider, Currency } from '../common/constants';
import { Refund } from './refund.entity';

@Entity('payments')
@Index(['orderId'], { unique: true })
@Index(['userId', 'status'])
@Index(['status', 'createdAt'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id', type: 'uuid', unique: true })
  @Index()
  orderId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 3 })
  currency: Currency;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  @Index()
  status: PaymentStatus;

  @Column({
    name: 'payment_method',
    type: 'enum',
    enum: PaymentMethod,
  })
  paymentMethod: PaymentMethod;

  @Column({
    type: 'enum',
    enum: PaymentProvider,
    default: PaymentProvider.STRIPE,
  })
  provider: PaymentProvider;

  // Provider-specific IDs
  @Column({ name: 'payment_intent_id', nullable: true, unique: true })
  @Index()
  paymentIntentId: string;

  @Column({ name: 'provider_payment_id', nullable: true })
  providerPaymentId: string;

  @Column({ name: 'provider_customer_id', nullable: true })
  providerCustomerId: string;

  // Card/Payment method details (masked)
  @Column({ name: 'card_last4', nullable: true })
  cardLast4: string;

  @Column({ name: 'card_brand', nullable: true })
  cardBrand: string;

  @Column({ name: 'card_exp_month', nullable: true })
  cardExpMonth: number;

  @Column({ name: 'card_exp_year', nullable: true })
  cardExpYear: number;

  // Timestamps
  @Column({ name: 'paid_at', type: 'timestamp', nullable: true })
  paidAt: Date;

  @Column({ name: 'failed_at', type: 'timestamp', nullable: true })
  failedAt: Date;

  @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
  cancelledAt: Date;

  // Error information
  @Column({ name: 'failure_code', nullable: true })
  failureCode: string;

  @Column({ name: 'failure_message', nullable: true })
  failureMessage: string;

  // Refunds
  @OneToMany(() => Refund, (refund) => refund.payment, { cascade: true })
  refunds: Refund[];

  @Column({ name: 'refunded_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  refundedAmount: number;

  // Metadata
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  description: string;

  // Receipt
  @Column({ name: 'receipt_url', nullable: true })
  receiptUrl: string;

  @Column({ name: 'receipt_email', nullable: true })
  receiptEmail: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: Date;
}
