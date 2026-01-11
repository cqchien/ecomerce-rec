import { RefundStatus, RefundReason } from '../../common/constants';

/**
 * Refund Domain Model (Pure TypeScript)
 * NO framework dependencies - follows clean architecture
 */
export class Refund {
  constructor(
    public readonly id: string,
    public readonly paymentId: string,
    public readonly amount: number,
    public status: RefundStatus,
    public readonly reason: RefundReason,
    public providerRefundId: string | null,
    public refundedAt: Date | null,
    public failedAt: Date | null,
    public failureReason: string | null,
    public notes: string | null,
    public requestedBy: string | null,
    public processedBy: string | null,
    public metadata: Record<string, any>,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}

  /**
   * Mark refund as succeeded
   */
  succeed(providerRefundId: string, processedBy?: string): void {
    this.status = RefundStatus.SUCCEEDED;
    this.refundedAt = new Date();
    this.providerRefundId = providerRefundId;
    
    if (processedBy) {
      this.processedBy = processedBy;
    }
  }

  /**
   * Mark refund as failed
   */
  fail(failureReason: string): void {
    this.status = RefundStatus.FAILED;
    this.failedAt = new Date();
    this.failureReason = failureReason;
  }

  /**
   * Mark refund as processing
   */
  process(): void {
    this.status = RefundStatus.PROCESSING;
  }

  /**
   * Cancel refund
   */
  cancel(): void {
    if (this.status === RefundStatus.SUCCEEDED) {
      throw new Error('Cannot cancel succeeded refund');
    }
    
    this.status = RefundStatus.CANCELLED;
  }

  /**
   * Check if refund is in final state
   */
  isFinalState(): boolean {
    return [
      RefundStatus.SUCCEEDED,
      RefundStatus.FAILED,
      RefundStatus.CANCELLED,
    ].includes(this.status);
  }

  /**
   * Check if refund is pending
   */
  isPending(): boolean {
    return this.status === RefundStatus.PENDING;
  }

  /**
   * Check if refund succeeded
   */
  isSucceeded(): boolean {
    return this.status === RefundStatus.SUCCEEDED;
  }

  /**
   * Check if refund failed
   */
  isFailed(): boolean {
    return this.status === RefundStatus.FAILED;
  }

  /**
   * Set provider refund ID
   */
  setProviderRefundId(providerRefundId: string): void {
    this.providerRefundId = providerRefundId;
  }

  /**
   * Update notes
   */
  updateNotes(notes: string): void {
    this.notes = notes;
  }
}
