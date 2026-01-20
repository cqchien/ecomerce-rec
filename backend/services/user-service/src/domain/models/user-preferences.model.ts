/**
 * UserPreferences domain model representing user preferences and settings.
 * Pure TypeScript class with no framework dependencies.
 */
export class UserPreferences {
  userId!: string;
  emailNotifications!: boolean;
  smsNotifications!: boolean;
  marketingEmails!: boolean;
  language!: string;
  currency!: string;
  updatedAt!: Date;

  constructor(partial: Partial<UserPreferences>) {
    Object.assign(this, partial);
  }

  /**
   * Update notification preferences.
   */
  updateNotificationPreferences(data: {
    emailNotifications?: boolean;
    smsNotifications?: boolean;
    marketingEmails?: boolean;
  }): void {
    if (data.emailNotifications !== undefined) {
      this.emailNotifications = data.emailNotifications;
    }
    if (data.smsNotifications !== undefined) {
      this.smsNotifications = data.smsNotifications;
    }
    if (data.marketingEmails !== undefined) {
      this.marketingEmails = data.marketingEmails;
    }
    this.updatedAt = new Date();
  }

  /**
   * Update language preference.
   */
  updateLanguage(language: string): void {
    this.language = language;
    this.updatedAt = new Date();
  }

  /**
   * Update currency preference.
   */
  updateCurrency(currency: string): void {
    this.currency = currency;
    this.updatedAt = new Date();
  }

  /**
   * Enable all notifications.
   */
  enableAllNotifications(): void {
    this.emailNotifications = true;
    this.smsNotifications = true;
    this.marketingEmails = true;
    this.updatedAt = new Date();
  }

  /**
   * Disable all notifications.
   */
  disableAllNotifications(): void {
    this.emailNotifications = false;
    this.smsNotifications = false;
    this.marketingEmails = false;
    this.updatedAt = new Date();
  }

  /**
   * Check if any notifications are enabled.
   */
  hasNotificationsEnabled(): boolean {
    return this.emailNotifications || this.smsNotifications || this.marketingEmails;
  }

  /**
   * Validate preferences data.
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    const validLanguages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko'];
    if (!validLanguages.includes(this.language)) {
      errors.push('Invalid language code');
    }

    const validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'CAD', 'AUD'];
    if (!validCurrencies.includes(this.currency)) {
      errors.push('Invalid currency code');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
