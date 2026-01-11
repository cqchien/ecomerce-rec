import { Refund } from '../models/refund.model';

/**
 * Refund Repository Interface (Domain Layer)
 * Defines contract for refund data access operations
 * Works with pure domain models, not TypeORM entities
 */
export interface IRefundRepository {
  /**
   * Find refund by ID
   */
  findById(id: string): Promise<Refund | null>;

  /**
   * Find refund by payment ID
   */
  findByPaymentId(paymentId: string): Promise<Refund[]>;

  /**
   * Find one refund by payment ID and status
   */
  findOneByPaymentIdAndStatus(paymentId: string, status: string): Promise<Refund | null>;

  /**
   * Create new refund
   */
  create(data: Partial<Refund>): Refund;

  /**
   * Save refund
   */
  save(refund: Refund): Promise<Refund>;

  /**
   * Delete refund
   */
  delete(id: string): Promise<void>;
}
