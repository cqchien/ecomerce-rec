/**
 * Pure Domain Model for Order Item
 * Contains business logic only - NO infrastructure concerns (TypeORM, etc.)
 */
export class OrderItemModel {
  id: string;
  orderId: string;
  productId: string;
  variantId: string;
  name: string;
  image: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  attributes: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;

  /**
   * Calculate total price for this item
   * Business rule: totalPrice = unitPrice * quantity (rounded to 2 decimals)
   */
  calculateTotal(): number {
    const total = this.unitPrice * this.quantity;
    return Math.round(total * 100) / 100;
  }

  /**
   * Update quantity and recalculate total price
   * Business rule: Quantity must be positive
   */
  updateQuantity(quantity: number): void {
    if (quantity <= 0) {
      throw new Error('Quantity must be greater than 0');
    }
    this.quantity = quantity;
    this.totalPrice = this.calculateTotal();
  }

  /**
   * Validate the order item has all required information
   */
  isValid(): boolean {
    return (
      !!this.productId &&
      !!this.name &&
      !!this.sku &&
      this.quantity > 0 &&
      this.unitPrice >= 0
    );
  }
}
