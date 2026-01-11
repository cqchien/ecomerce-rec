import { Entity, Column, PrimaryColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('user_preferences')
@Index(['userId'])
export class UserPreferencesEntity {
  @PrimaryColumn('uuid', { name: 'user_id' })
  userId: string;

  @Column({ name: 'email_notifications', default: true })
  emailNotifications: boolean;

  @Column({ name: 'sms_notifications', default: false })
  smsNotifications: boolean;

  @Column({ name: 'marketing_emails', default: false })
  marketingEmails: boolean;

  @Column({ default: 'en' })
  language: string;

  @Column({ default: 'USD' })
  currency: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
