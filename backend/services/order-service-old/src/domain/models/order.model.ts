import { OrderStatus, PaymentMethod } from '../common/constants';
import { OrderItemModel } from './order-item.model';
import { OrderStatusHistoryModel } from './order-status-history.model';

export interface AddressInfo {
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface ShippingDetails {
  trackingNumber: string;
  carrier: string;
  estimatedDeliveryDays?: number;
}

/**
 * Pure Domain Model for Order
 * Contains business logic only - NO infrastructure concerns (TypeORM, etc.)
 * All business rules and state transitions are encapsulated here
 */
export class OrderModel {
  id: string;
  orderNumber: string;
  userId: string;
  items: OrderItemModel[];
  statusHistory: OrderStatusHistoryModel[];
  subtotal: number;
  shippingCost: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentIntentId: string;
  paymentId: string;
  paidAt: Date;
  shippingAddress: AddressInfo;
  billingAddress: AddressInfo;
  trackingNumber: string;
  carrier: string;
  shippedAt: Date;
  estimatedDelivery: Date;
  deliveredAt: Date;
  cancelledAt: Date;
  cancellationReason: string;
  cancelledBy: string;
  customerNotes: string;
  internalNotes: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;

  /**
   * Calculate complete pricing breakdown
   * Business rule: total = subtotal + shippingCost + taxAmount - discountAmount
   * Returns object with all pricing components
   */
  calculatePricing(): {
    subtotal: number;
    shippingCost: number;
    taxAmount: number;
    discountAmount: number;
    total: number;
  } {
    const subtotal = this.items?.reduce((sum, item) => sum + item.totalPrice, 0) || 0;
    const total = subtotal + this.shippingCost + this.taxAmount - this.discountAmount;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      shippingCost: Math.round(this.shippingCost * 100) / 100,
      taxAmount: Math.round(this.taxAmount * 100) / 100,
      discountAmount: Math.round(this.discountAmount * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }

  /**
   * Confirm order after successful payment
   * Business rule: Can only confirm if payment is successful
   * @throws Error if payment validation fails
   */
  confirm(paymentId: string): void {
    if (!paymentId) {
      throw new Error('Payment ID is required to confirm order');
    }

    if (this.status !== OrderStatus.PAYMENT_PENDING && this.status !== OrderStatus.PENDING) {
      throw new Error(`Cannot confirm order in ${this.status} status`);
    }

    this.paymentId = paymentId;
    this.status = OrderStatus.CONFIRMED;
    this.paidAt = new Date();
  }

  /**
   * Mark order as shipped with tracking details
   * Business rule: Can only ship confirmed/preparing orders
   * @throws Error if order cannot be shipped
   */
  ship(shippingDetails: ShippingDetails): void {
    if (![OrderStatus.CONFIRMED, OrderStatus.PREPARING].includes(this.status)) {
      throw new Error(`Cannot ship order in ${this.status} status`);
    }

    if (!shippingDetails.trackingNumber || !shippingDetails.carrier) {
      throw new Error('Tracking number and carrier are required');
    }

    this.trackingNumber = shippingDetails.trackingNumber;
    this.carrier = shippingDetails.carrier;
    this.shippedAt = new Date();
    this.status = OrderStatus.SHIPPED;

    if (shippingDetails.estimatedDeliveryDays) {
      this.estimatedDelivery = this.estimateDeliveryDate(shippingDetails.estimatedDeliveryDays);
    }
  }

  /**
   * Mark order as delivered
   * Business rule: Can only deliver shipped orders
   * @throws Error if order cannot be delivered
   */
  deliver(): void {
    if (this.status !== OrderStatus.SHIPPED) {
      throw new Error(`Cannot deliver order in ${this.status} status. Order must be shipped first.`);
    }

    this.status = OrderStatus.DELIVERED;
    this.deliveredAt = new Date();
  }

  /**
   * Cancel order with reason
   * Business rule: Can only cancel orders in specific statuses
   * @throws Error if order cannot be cancelled
   */
  cancel(reason: string, cancelledBy?: string): void {
    if (!this.canBeCancelled()) {
      throw new Error(
        `Cannot cancel order in ${this.status} status. ` +
        `Only orders in PENDING, PROCESSING, PAYMENT_PENDING, CONFIRMED, or PREPARING status can be cancelled.`
      );
    }

    if (!reason || reason.trim().length === 0) {
      throw new Error('Cancellation reason is required');
    }

    this.status = OrderStatus.CANCELLED;
    this.cancelledAt = new Date();
    this.cancellationReason = reason;
    this.cancelledBy = cancelledBy || this.userId;
  }

  /**
   * Check if order can be cancelled
   * Business rule: Only certain statuses allow cancellation
   */
  canBeCancelled(): boolean {
    return [
      OrderStatus.PENDING,
      OrderStatus.PROCESSING,
      OrderStatus.PAYMENT_PENDING,
      OrderStatus.CONFIRMED,
      OrderStatus.PREPARING,
    ].includes(this.status);
  }

  /**
   * Check if order payment is completed
   * Business rule: Order is paid if paymentId exists and paidAt is set
   */
  isPaid(): boolean {
    return !!this.paymentId && !!this.paidAt;
  }

  /**
   * Estimate delivery date based on number of days from now
   * @param days Number of days to add to current date
   * @returns Estimated delivery date
   */
  estimateDeliveryDate(days: number): Date {
    if (days < 0) {
      throw new Error('Delivery days must be a positive number');
    }

    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }

  /**
   * Update order status (legacy method for backward compatibility)
   * Consider using specific methods like confirm(), ship(), deliver(), cancel() instead
   */
  updateStatus(status: OrderStatus, note?: string, updatedBy?: string): void {
    this.status = status;

    if (status === OrderStatus.CONFIRMED) {
      this.paidAt = new Date();
    } else if (status === OrderStatus.CANCELLED) {
      this.cancelledAt = new Date();
    } else if (status === OrderStatus.DELIVERED) {
      this.deliveredAt = new Date();
    }
  }

  /**
   * Calculate total price (simple version)
   * Business rule: total = subtotal + shippingCost + taxAmount - discountAmount
   */
  calculateTotal(): number {
    const total = this.subtotal + this.shippingCost + this.taxAmount - this.discountAmount;
    return Math.round(total * 100) / 100;
  }

  /**
   * Legacy method for setting shipping (use ship() instead)
   * @deprecated Use ship() method instead
   */
  setShipping(trackingNumber: string, carrier: string, estimatedDeliveryDays: number): void {
    this.trackingNumber = trackingNumber;
    this.carrier = carrier;
    this.shippedAt = new Date();
    this.estimatedDelivery = this.estimateDeliveryDate(estimatedDeliveryDays);
  }

  /**
   * Legacy method for marking as delivered (use deliver() instead)
   * @deprecated Use deliver() method instead
   */
  markAsDelivered(): void {
    this.status = OrderStatus.DELIVERED;
    this.deliveredAt = new Date();
  }

  /**
   * Check if order is cancellable within a time window
   * Business rule: Orders can be cancelled within hoursWindow or if still PENDING
   */
  isCancellable(hoursWindow: number): boolean {
    if (!this.canBeCancelled()) {
      return false;
    }

    const hoursSinceCreation = (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60);
    return hoursSinceCreation <= hoursWindow || this.status === OrderStatus.PENDING;
  }
}
