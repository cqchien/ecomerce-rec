import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
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
   * List all addresses for a user.
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
   * Add a new address for a user.
   */
  async addAddress(dto: AddAddressDto): Promise<Address> {
    const address = new Address(
      uuidv4(),
      dto.userId,
      dto.firstName,
      dto.lastName,
      dto.addressLine1,
      dto.addressLine2 || null,
      dto.city,
      dto.state,
      dto.postalCode,
      dto.country,
      dto.phone,
      dto.isDefault || false,
      new Date(),
      new Date(),
      null,
    );

    const validation = address.validate();
    if (!validation.valid) {
      throw new BadRequestException(validation.errors.join(', '));
    }

    if (dto.isDefault) {
      await this.addressRepository.setAsDefault(address.id, dto.userId);
    }

    const savedAddress = await this.addressRepository.save(address);

    await this.invalidateAddressCache(dto.userId);

    return savedAddress;
  }

  /**
   * Update an existing address.
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
   * Delete an address (soft delete).
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
   * Invalidate address cache for a user.
   */
  private async invalidateAddressCache(userId: string, addressId?: string): Promise<void> {
    const keys = [`${CACHE_KEY_ADDRESSES}${userId}`];
    if (addressId) {
      keys.push(`${CACHE_KEY_ADDRESS}${addressId}`);
    }
    await this.redisService.del(...keys);
  }
}
