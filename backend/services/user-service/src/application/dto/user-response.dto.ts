import { User } from '../../domain/models/user.model';
import { Address } from '../../domain/models/address.model';
import { UserPreferences } from '../../domain/models/user-preferences.model';
import { WishlistItem } from '../../domain/models/wishlist-item.model';

/**
 * DTO for address response
 */
export class AddressResponseDto {
  id: string;
  userId: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;

  constructor(address: Address) {
    this.id = address.id;
    this.userId = address.userId;
    this.addressLine1 = address.addressLine1;
    this.addressLine2 = address.addressLine2 || null;
    this.city = address.city;
    this.state = address.state || null;
    this.postalCode = address.postalCode;
    this.country = address.country;
    this.isDefault = address.isDefault;
    this.createdAt = address.createdAt.toISOString();
    this.updatedAt = address.updatedAt.toISOString();
  }
}

/**
 * DTO for user preferences response
 */
export class UserPreferencesResponseDto {
  userId: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
  language: string;
  currency: string;
  updatedAt: string;

  constructor(preferences: UserPreferences) {
    this.userId = preferences.userId;
    this.emailNotifications = preferences.emailNotifications;
    this.smsNotifications = preferences.smsNotifications;
    this.marketingEmails = preferences.marketingEmails;
    this.language = preferences.language;
    this.currency = preferences.currency;
    this.updatedAt = preferences.updatedAt.toISOString();
  }
}

/**
 * DTO for wishlist item response
 */
export class WishlistItemResponseDto {
  id: string;
  userId: string;
  productId: string;
  addedAt: string;

  constructor(item: WishlistItem) {
    this.id = item.id;
    this.userId = item.userId;
    this.productId = item.productId;
    this.addedAt = item.addedAt.toISOString();
  }
}

/**
 * DTO for user profile response
 */
export class UserProfileResponseDto {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatar: string | null;
  createdAt: string;
  updatedAt: string;
  addresses?: AddressResponseDto[];
  wishlist?: WishlistItemResponseDto[];

  constructor(user: User, includeRelations = false) {
    this.id = user.id;
    this.email = user.email;
    this.name = user.name;
    this.phone = user.phone || null;
    this.avatar = user.avatar || null;
    this.createdAt = user.createdAt.toISOString();
    this.updatedAt = user.updatedAt.toISOString();

    if (includeRelations) {
      if (user.addresses && user.addresses.length > 0) {
        this.addresses = user.addresses.map(addr => new AddressResponseDto(addr));
      }
      if (user.wishlist && user.wishlist.length > 0) {
        this.wishlist = user.wishlist.map(item => new WishlistItemResponseDto(item));
      }
    }
  }
}

/**
 * DTO for address list response
 */
export class AddressListResponseDto {
  addresses: AddressResponseDto[];
  total: number;

  constructor(addresses: Address[]) {
    this.addresses = addresses.map(addr => new AddressResponseDto(addr));
    this.total = addresses.length;
  }
}

/**
 * DTO for wishlist response
 */
export class WishlistResponseDto {
  items: WishlistItemResponseDto[];
  total: number;

  constructor(items: WishlistItem[]) {
    this.items = items.map(item => new WishlistItemResponseDto(item));
    this.total = items.length;
  }
}
