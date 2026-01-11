/**
 * Cart Item Domain Model (Pure TypeScript)
 * NO framework dependencies - follows clean architecture
 */
export class CartItem {
  constructor(
    public readonly id: string,
    public readonly cartId: string,
    public readonly productId: string,
    public readonly name: string,
    public readonly unitPrice: number,
    public quantity: number,
    public totalPrice: number,
    public readonly variantId?: string,
    public readonly image?: string,
    public readonly sku?: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}

  /**
   * Update quantity and recalculate total price
   */
  updateQuantity(newQuantity: number): void {
    this.quantity = newQuantity;
    this.calculateTotalPrice();
  }

  /**
   * Add to quantity
   */
  addQuantity(amount: number): void {
    this.quantity += amount;
    this.calculateTotalPrice();
  }

  /**
   * Calculate total price based on quantity and unit price
   */
  calculateTotalPrice(): void {
    this.totalPrice = this.roundPrice(this.quantity * this.unitPrice);
  }

  /**
   * Check if item matches product and variant
   */
  matches(productId: string, variantId?: string): boolean {
    return this.productId === productId && 
           (this.variantId || '') === (variantId || '');
  }

  private roundPrice(value: number): number {
    return Number(value.toFixed(2));
  }
}
