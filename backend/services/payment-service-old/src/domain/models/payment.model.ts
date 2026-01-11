import { PaymentStatus, PaymentMethod, PaymentProvider, Currency, PAYMENT_RULES } from '../../common/constants';

/**
 * Payment Domain Model (Pure TypeScript)
 * NO framework dependencies - follows clean architecture
 */
export class Payment {
  constructor(
    public readonly id: string,
    public readonly orderId: string,
    public readonly userId: string,
    public amount: number,
    public readonly currency: Currency,
    public status: PaymentStatus,
    public readonly paymentMethod: PaymentMethod,
    public readonly provider: PaymentProvider,
    public paymentIntentId: string | null,
    public providerPaymentId: string | null,
    public providerCustomerId: string | null,
    public cardLast4: string | null,
    public cardBrand: string | null,
    public cardExpMonth: number | null,
    public cardExpYear: number | null,
    public paidAt: Date | null,
    public failedAt: Date | null,
    public cancelledAt: Date | null,
    public failureCode: string | null,
    public failureMessage: string | null,
    public refundedAmount: number,
    public metadata: Record<string, any>,
    public description: string | null,
    public receiptUrl: string | null,
    public receiptEmail: string | null,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}

  /**
   * Process payment to succeeded status
   */
  succeed(paidAt: Date, providerPaymentId: string, cardDetails?: {
    last4?: string;
    brand?: string;
    expMonth?: number;
    expYear?: number;
  }, receiptUrl?: string): void {
    this.status = PaymentStatus.SUCCEEDED;
    this.paidAt = paidAt;
    this.providerPaymentId = providerPaymentId;
    
    if (cardDetails) {
      this.cardLast4 = cardDetails.last4 || null;
      this.cardBrand = cardDetails.brand || null;
      this.cardExpMonth = cardDetails.expMonth || null;
      this.cardExpYear = cardDetails.expYear || null;
    }
    
    if (receiptUrl) {
      this.receiptUrl = receiptUrl;
    }
  }

  /**
   * Mark payment as failed
   */
  fail(failureCode: string, failureMessage: string): void {
    this.status = PaymentStatus.FAILED;
    this.failedAt = new Date();
    this.failureCode = failureCode;
    this.failureMessage = failureMessage;
  }

  /**
   * Cancel payment
   */
  cancel(): void {
    if (this.status === PaymentStatus.SUCCEEDED) {
      throw new Error('Cannot cancel succeeded payment, use refund instead');
    }
    
    if (this.status === PaymentStatus.CANCELLED) {
      return;
    }
    
    this.status = PaymentStatus.CANCELLED;
    this.cancelledAt = new Date();
  }

  /**
   * Mark payment as processing
   */
  process(): void {
    this.status = PaymentStatus.PROCESSING;
  }

  /**
   * Mark payment as requires action
   */
  requiresAction(): void {
    this.status = PaymentStatus.REQUIRES_ACTION;
  }

  /**
   * Apply refund amount
   */
  refund(amount: number): void {
    if (this.status !== PaymentStatus.SUCCEEDED) {
      throw new Error('Can only refund succeeded payments');
    }
    
    const newRefundedAmount = this.refundedAmount + amount;
    
    if (newRefundedAmount > this.amount) {
      throw new Error('Refund amount exceeds payment amount');
    }
    
    this.refundedAmount = newRefundedAmount;
    
    if (this.refundedAmount >= this.amount) {
      this.status = PaymentStatus.REFUNDED;
    } else {
      this.status = PaymentStatus.PARTIALLY_REFUNDED;
    }
  }

  /**
   * Check if payment can be refunded
   */
  canBeRefunded(): boolean {
    if (this.status !== PaymentStatus.SUCCEEDED && 
        this.status !== PaymentStatus.PARTIALLY_REFUNDED) {
      return false;
    }
    
    if (!this.paidAt) {
      return false;
    }
    
    const daysSincePayment = (Date.now() - this.paidAt.getTime()) / (1000 * 60 * 60 * 24);
    
    return this.refundedAmount < this.amount && daysSincePayment <= PAYMENT_RULES.REFUND_WINDOW_DAYS;
  }

  /**
   * Calculate refundable amount
   */
  calculateRefundableAmount(): number {
    return this.amount - this.refundedAmount;
  }

  /**
   * Check if payment is in final state
   */
  isFinalState(): boolean {
    return [
      PaymentStatus.SUCCEEDED,
      PaymentStatus.FAILED,
      PaymentStatus.CANCELLED,
      PaymentStatus.REFUNDED,
    ].includes(this.status);
  }

  /**
   * Check if payment is pending
   */
  isPending(): boolean {
    return this.status === PaymentStatus.PENDING;
  }

  /**
   * Check if payment succeeded
   */
  isSucceeded(): boolean {
    return this.status === PaymentStatus.SUCCEEDED;
  }

  /**
   * Check if payment failed
   */
  isFailed(): boolean {
    return this.status === PaymentStatus.FAILED;
  }

  /**
   * Check if payment is cancelled
   */
  isCancelled(): boolean {
    return this.status === PaymentStatus.CANCELLED;
  }

  /**
   * Update payment intent ID
   */
  setPaymentIntentId(paymentIntentId: string): void {
    this.paymentIntentId = paymentIntentId;
  }

  /**
   * Update provider customer ID
   */
  setProviderCustomerId(customerId: string): void {
    this.providerCustomerId = customerId;
  }
}
