import { Controller, Inject } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { UserService } from '../../application/services/user.service';
import { AddressService } from '../../application/services/address.service';
import { WishlistService } from '../../application/services/wishlist.service';

@Controller()
export class UserGrpcController {
  constructor(
    private readonly userService: UserService,
    private readonly addressService: AddressService,
    private readonly wishlistService: WishlistService,
  ) {}

  @GrpcMethod('UserService', 'CreateUser')
  async createUser(data: any) {
    // Create user profile (name combines first_name and last_name)
    const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim();
    const user = await this.userService.createUser(data.email, fullName);
    
    return {
      user: {
        id: user.id,
        email: user.email,
        password: '', // Not stored in user-service
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        created_at: { seconds: Math.floor(user.createdAt.getTime() / 1000), nanos: 0 },
        updated_at: { seconds: Math.floor(user.updatedAt.getTime() / 1000), nanos: 0 },
      },
    };
  }

  @GrpcMethod('UserService', 'GetByEmail')
  async getByEmail(data: any) {
    // We need to add getByEmail to UserService
    // For now, return an error
    throw new Error('GetByEmail not yet implemented - auth should check auth.users table directly');
  }

  @GrpcMethod('UserService', 'GetProfile')
  async getProfile(data: any) {
    const profile = await this.userService.getProfile(data.user_id);
    
    if (!profile) {
      throw new Error('Profile not found');
    }

    return {
      profile: {
        id: profile.id,
        email: profile.email || '',
        name: profile.name || '',
        phone: profile.phone || '',
        avatar: profile.avatar || '',
        created_at: profile.createdAt ? { seconds: Math.floor(profile.createdAt.getTime() / 1000), nanos: 0 } : null,
        updated_at: profile.updatedAt ? { seconds: Math.floor(profile.updatedAt.getTime() / 1000), nanos: 0 } : null,
      },
    };
  }

  @GrpcMethod('UserService', 'UpdateProfile')
  async updateProfile(data: any) {
    const profile = await this.userService.updateProfile({
      userId: data.user_id,
      name: data.name,
      phone: data.phone,
      avatar: data.avatar,
    });

    return {
      profile: {
        id: profile.id,
        email: profile.email || '',
        name: profile.name || '',
        phone: profile.phone || '',
        avatar: profile.avatar || '',
        created_at: profile.createdAt ? { seconds: Math.floor(profile.createdAt.getTime() / 1000), nanos: 0 } : null,
        updated_at: profile.updatedAt ? { seconds: Math.floor(profile.updatedAt.getTime() / 1000), nanos: 0 } : null,
      },
    };
  }

  @GrpcMethod('UserService', 'AddAddress')
  async addAddress(data: any) {
    const address = await this.addressService.addAddress({
      userId: data.user_id,
      firstName: data.first_name,
      lastName: data.last_name,
      phone: data.phone,
      addressLine1: data.address_line1,
      addressLine2: data.address_line2,
      city: data.city,
      state: data.state,
      postalCode: data.postal_code,
      country: data.country,
      isDefault: data.is_default,
    });

    return {
      address: {
        id: address.id,
        user_id: address.userId,
        first_name: address.firstName,
        last_name: address.lastName,
        phone: address.phone,
        address_line1: address.addressLine1,
        address_line2: address.addressLine2,
        city: address.city,
        state: address.state,
        postal_code: address.postalCode,
        country: address.country,
        is_default: address.isDefault,
        created_at: address.createdAt ? { seconds: Math.floor(address.createdAt.getTime() / 1000), nanos: 0 } : null,
        updated_at: address.updatedAt ? { seconds: Math.floor(address.updatedAt.getTime() / 1000), nanos: 0 } : null,
      },
    };
  }

  @GrpcMethod('UserService', 'ListAddresses')
  async listAddresses(data: any) {
    const addresses = await this.addressService.listAddresses(data.user_id);

    return {
      addresses: addresses.map(address => ({
        id: address.id,
        user_id: address.userId,
        first_name: address.firstName,
        last_name: address.lastName,
        phone: address.phone,
        address_line1: address.addressLine1,
        address_line2: address.addressLine2,
        city: address.city,
        state: address.state,
        postal_code: address.postalCode,
        country: address.country,
        is_default: address.isDefault,
        created_at: { seconds: Math.floor(address.createdAt.getTime() / 1000), nanos: 0 },
        updated_at: { seconds: Math.floor(address.updatedAt.getTime() / 1000), nanos: 0 },
      })),
    };
  }

  @GrpcMethod('UserService', 'UpdateAddress')
  async updateAddress(data: any) {
    const address = await this.addressService.updateAddress({
      addressId: data.id,
      userId: data.user_id,
      firstName: data.first_name,
      lastName: data.last_name,
      phone: data.phone,
      addressLine1: data.address_line1,
      addressLine2: data.address_line2,
      city: data.city,
      state: data.state,
      postalCode: data.postal_code,
      country: data.country,
      isDefault: data.is_default,
    });

    return {
      address: {
        id: address.id,
        user_id: address.userId,
        first_name: address.firstName,
        last_name: address.lastName,
        phone: address.phone,
        address_line1: address.addressLine1,
        address_line2: address.addressLine2,
        city: address.city,
        state: address.state,
        postal_code: address.postalCode,
        country: address.country,
        is_default: address.isDefault,
        created_at: { seconds: Math.floor(address.createdAt.getTime() / 1000), nanos: 0 },
        updated_at: { seconds: Math.floor(address.updatedAt.getTime() / 1000), nanos: 0 },
      },
    };
  }

  @GrpcMethod('UserService', 'DeleteAddress')
  async deleteAddress(data: any) {
    await this.addressService.deleteAddress(data.id, data.user_id);

    return {
      success: true,
      message: 'Address deleted successfully',
    };
  }

  @GrpcMethod('UserService', 'AddToWishlist')
  async addToWishlist(data: any) {
    const item = await this.wishlistService.addToWishlist(data.user_id, data.product_id);

    return {
      item: {
        id: item.id,
        user_id: item.userId,
        product_id: item.productId,
        created_at: { seconds: Math.floor(item.addedAt.getTime() / 1000), nanos: 0 },
      },
    };
  }

  @GrpcMethod('UserService', 'GetWishlist')
  async getWishlist(data: any) {
    const wishlist = await this.wishlistService.getWishlist(data.user_id);

    return {
      items: wishlist.items.map(item => ({
        id: item.id,
        user_id: item.userId,
        product_id: item.productId,
        created_at: { seconds: Math.floor(item.addedAt.getTime() / 1000), nanos: 0 },
      })),
    };
  }

  @GrpcMethod('UserService', 'RemoveFromWishlist')
  async removeFromWishlist(data: any) {
    await this.wishlistService.removeFromWishlist(data.user_id, data.product_id);

    return {
      success: true,
      message: 'Item removed from wishlist',
    };
  }
}
