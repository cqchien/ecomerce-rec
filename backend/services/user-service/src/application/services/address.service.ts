import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { Address } from '../../domain/models/address.model';
import { IAddressRepository } from '../../domain/interfaces/address-repository.interface';
import { AddAddressDto, UpdateAddressDto } from '../dto/address.dto';
import { CACHE_KEY_ADDRESS, CACHE_KEY_ADDRESSES, ADDRESS_CACHE_TTL } from '../../common/constants';
import { RedisService } from '../../infrastructure/redis/redis.service';

@Injectable()
export class AddressService {
  constructor(
    @Inject('IAddressRepository')
    private readonly addressRepository: IAddressRepository,
    private readonly redisService: RedisService,
  ) {}

  /**
   * List all addresses for a user
   * @param userId User ID
   * @return List of user addresses
   */
  async listAddresses(userId: string): Promise<Address[]> {
    const cacheKey = `${CACHE_KEY_ADDRESSES}${userId}`;
    const cached = await this.redisService.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached as string);
    }

    const addresses = await this.addressRepository.findByUserId(userId);

    await this.redisService.set(cacheKey, JSON.stringify(addresses), ADDRESS_CACHE_TTL);

    return addresses;
  }

  /**
   * Add a new address for a user
   * @param dto Address data transfer object
   * @return Created address
   */
  async addAddress(dto: AddAddressDto): Promise<Address> {
    const address = new Address({
      userId: dto.userId,
      firstName: dto.firstName,
      lastName: dto.lastName,
      addressLine1: dto.addressLine1,
      addressLine2: dto.addressLine2 || null,
      city: dto.city,
      state: dto.state,
      postalCode: dto.postalCode,
      country: dto.country,
      phone: dto.phone,
      isDefault: dto.isDefault || false,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    const validation = address.validate();
    if (!validation.valid) {
      throw new BadRequestException(validation.errors.join(', '));
    }

    const savedAddress = await this.addressRepository.save(address);

    if (dto.isDefault) {
      await this.addressRepository.setAsDefault(savedAddress.id!, dto.userId);
    }

    await this.invalidateAddressCache(dto.userId);

    return savedAddress;
  }

  /**
   * Update an existing address
   * @param dto Update address data transfer object
   * @return Updated address
   */
  async updateAddress(dto: UpdateAddressDto): Promise<Address> {
    const address = await this.addressRepository.findById(dto.addressId);

    if (!address || address.userId !== dto.userId) {
      throw new NotFoundException(`Address not found: ${dto.addressId}`);
    }

    address.updateAddress({
      firstName: dto.firstName,
      lastName: dto.lastName,
      addressLine1: dto.addressLine1,
      addressLine2: dto.addressLine2,
      city: dto.city,
      state: dto.state,
      postalCode: dto.postalCode,
      country: dto.country,
      phone: dto.phone,
    });

    const validation = address.validate();
    if (!validation.valid) {
      throw new BadRequestException(validation.errors.join(', '));
    }

    if (dto.isDefault === true) {
      await this.addressRepository.setAsDefault(dto.addressId, dto.userId);
      address.setAsDefault();
    }

    const updatedAddress = await this.addressRepository.save(address);

    await this.invalidateAddressCache(dto.userId, dto.addressId);

    return updatedAddress;
  }

  /**
   * Delete an address (soft delete)
   * @param userId User ID
   * @param addressId Address ID
   */
  async deleteAddress(userId: string, addressId: string): Promise<void> {
    const address = await this.addressRepository.findById(addressId);

    if (!address || address.userId !== userId) {
      throw new NotFoundException(`Address not found: ${addressId}`);
    }

    await this.addressRepository.softDelete(addressId);

    await this.invalidateAddressCache(userId, addressId);
  }

  /**
   * Invalidate address cache for a user
   * @param userId User ID
   * @param addressId Optional address ID
   */
  private async invalidateAddressCache(userId: string, addressId?: string): Promise<void> {
    const keys = [`${CACHE_KEY_ADDRESSES}${userId}`];
    if (addressId) {
      keys.push(`${CACHE_KEY_ADDRESS}${addressId}`);
    }
    await this.redisService.del(...keys);
  }
}
