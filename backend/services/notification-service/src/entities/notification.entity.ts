import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('notifications')
@Index(['userId', 'createdAt'])
@Index(['status', 'createdAt'])
@Index(['type', 'status'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  @Index()
  userId: string;

  @Column({ type: 'varchar', length: 50 })
  type: string; // email, sms, push, in_app

  @Column({ type: 'varchar', length: 50 })
  channel: string; // order, user, payment, marketing, system

  @Column({ type: 'varchar', length: 100 })
  template: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  recipient: string; // email address or phone number

  @Column({ type: 'varchar', length: 255 })
  subject: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, any>;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  @Index()
  status: string; // pending, sent, failed, queued, processing, delivered, bounced

  @Column({ type: 'varchar', length: 50, default: 'normal' })
  priority: string; // low, normal, high, critical

  @Column({ type: 'int', default: 0 })
  retryCount: number;

  @Column({ type: 'text', nullable: true })
  error: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  provider: string; // sendgrid, twilio, firebase

  @Column({ type: 'varchar', length: 255, nullable: true })
  providerMessageId: string;

  @Column({ type: 'timestamp', nullable: true })
  sentAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deliveredAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  failedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
