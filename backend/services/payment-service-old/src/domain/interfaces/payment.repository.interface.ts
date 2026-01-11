import { Payment } from '../models/payment.model';

/**
 * Payment Repository Interface (Domain Layer)
 * Defines contract for payment data access operations
 * Works with pure domain models, not TypeORM entities
 */
export interface IPaymentRepository {
  /**
   * Create new payment
   */
  create(data: Partial<Payment>): Payment;

  /**
   * Find payment by ID
   */
  findById(id: string): Promise<Payment | null>;

  /**
   * Find payment by order ID
   */
  findByOrderId(orderId: string): Promise<Payment | null>;

  /**
   * Find payment by payment intent ID
   */
  findByPaymentIntentId(paymentIntentId: string): Promise<Payment | null>;

  /**
   * Find payment by provider payment ID
   */
  findByProviderPaymentId(providerPaymentId: string): Promise<Payment | null>;

  /**
   * Find payments by user ID with pagination
   */
  findByUserId(userId: string, limit?: number, offset?: number): Promise<{ payments: Payment[]; total: number }>;

  /**
   * Save payment
   */
  save(payment: Payment): Promise<Payment>;

  /**
   * Delete payment
   */
  delete(id: string): Promise<void>;
}
