import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { PaymentEntity } from './payment.entity';
import { RefundStatus, RefundReason } from '../../../common/constants';

@Entity('refunds')
@Index(['paymentId', 'status'])
export class RefundEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'payment_id', type: 'uuid' })
  @Index()
  paymentId: string;

  @ManyToOne(() => PaymentEntity, (payment) => payment.refunds, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'payment_id' })
  payment: PaymentEntity;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: RefundStatus,
    default: RefundStatus.PENDING,
  })
  @Index()
  status: RefundStatus;

  @Column({
    type: 'enum',
    enum: RefundReason,
  })
  reason: RefundReason;

  @Column({ name: 'provider_refund_id', nullable: true })
  providerRefundId: string;

  @Column({ name: 'refunded_at', type: 'timestamp', nullable: true })
  refundedAt: Date;

  @Column({ name: 'failed_at', type: 'timestamp', nullable: true })
  failedAt: Date;

  @Column({ name: 'failure_reason', nullable: true })
  failureReason: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'requested_by', nullable: true })
  requestedBy: string;

  @Column({ name: 'processed_by', nullable: true })
  processedBy: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
