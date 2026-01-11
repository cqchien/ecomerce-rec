/**
 * Address domain model representing a user's address.
 * Pure TypeScript class with no framework dependencies.
 */
export class Address {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public firstName: string,
    public lastName: string,
    public addressLine1: string,
    public addressLine2: string | null,
    public city: string,
    public state: string,
    public postalCode: string,
    public country: string,
    public phone: string,
    public isDefault: boolean,
    public readonly createdAt: Date,
    public updatedAt: Date,
    public deletedAt: Date | null,
  ) {}

  /**
   * Update address information.
   */
  updateAddress(data: {
    firstName?: string;
    lastName?: string;
    addressLine1?: string;
    addressLine2?: string | null;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    phone?: string;
  }): void {
    if (data.firstName !== undefined) this.firstName = data.firstName;
    if (data.lastName !== undefined) this.lastName = data.lastName;
    if (data.addressLine1 !== undefined) this.addressLine1 = data.addressLine1;
    if (data.addressLine2 !== undefined) this.addressLine2 = data.addressLine2;
    if (data.city !== undefined) this.city = data.city;
    if (data.state !== undefined) this.state = data.state;
    if (data.postalCode !== undefined) this.postalCode = data.postalCode;
    if (data.country !== undefined) this.country = data.country;
    if (data.phone !== undefined) this.phone = data.phone;
    this.updatedAt = new Date();
  }

  /**
   * Set as default address.
   */
  setAsDefault(): void {
    this.isDefault = true;
    this.updatedAt = new Date();
  }

  /**
   * Remove default status.
   */
  removeDefault(): void {
    this.isDefault = false;
    this.updatedAt = new Date();
  }

  /**
   * Soft delete address.
   */
  softDelete(): void {
    this.deletedAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Restore soft-deleted address.
   */
  restore(): void {
    this.deletedAt = null;
    this.updatedAt = new Date();
  }

  /**
   * Check if address is deleted.
   */
  isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  /**
   * Get full name.
   */
  getFullName(): string {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  /**
   * Get formatted address.
   */
  getFormattedAddress(): string {
    const parts = [
      this.addressLine1,
      this.addressLine2,
      this.city,
      this.state,
      this.postalCode,
      this.country,
    ].filter(Boolean);

    return parts.join(', ');
  }

  /**
   * Validate address data.
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.firstName || this.firstName.trim().length === 0) {
      errors.push('First name is required');
    }

    if (!this.lastName || this.lastName.trim().length === 0) {
      errors.push('Last name is required');
    }

    if (!this.addressLine1 || this.addressLine1.trim().length === 0) {
      errors.push('Address line 1 is required');
    }

    if (!this.city || this.city.trim().length === 0) {
      errors.push('City is required');
    }

    if (!this.state || this.state.trim().length === 0) {
      errors.push('State is required');
    }

    if (!this.postalCode || this.postalCode.trim().length === 0) {
      errors.push('Postal code is required');
    }

    if (!this.country || this.country.trim().length === 0) {
      errors.push('Country is required');
    }

    if (!this.phone || !/^\+?[\d\s-()]+$/.test(this.phone)) {
      errors.push('Valid phone number is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
