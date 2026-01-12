import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IAddressRepository } from '../../domain/interfaces/address-repository.interface';
import { Address } from '../../domain/models/address.model';
import { AddressEntity } from '../persistence/entities/address.entity';
import { AddressMapper } from '../persistence/mappers/address.mapper';

/**
 * TypeORM implementation of IAddressRepository.
 * Handles address persistence using TypeORM and mappers.
 */
@Injectable()
export class AddressRepository implements IAddressRepository {
  constructor(
    @InjectRepository(AddressEntity)
    private readonly typeormRepository: Repository<AddressEntity>,
  ) {}

  async findById(id: string): Promise<Address | null> {
    const entity = await this.typeormRepository.findOne({ where: { id } });
    return entity ? AddressMapper.toDomain(entity) : null;
  }

  async findByUserId(userId: string): Promise<Address[]> {
    const entities = await this.typeormRepository.find({
      where: { userId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });
    return AddressMapper.toDomainList(entities);
  }

  async findDefaultByUserId(userId: string): Promise<Address | null> {
    const entity = await this.typeormRepository.findOne({
      where: { userId, isDefault: true },
    });
    return entity ? AddressMapper.toDomain(entity) : null;
  }

  async save(address: Address): Promise<Address> {
    const entity = AddressMapper.toEntity(address);
    const saved = await this.typeormRepository.save(entity);
    return AddressMapper.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.typeormRepository.delete(id);
  }

  async softDelete(id: string): Promise<void> {
    await this.typeormRepository.softDelete(id);
  }

  async setAsDefault(id: string, userId: string): Promise<void> {
    await this.typeormRepository.update(
      { userId },
      { isDefault: false },
    );
    await this.typeormRepository.update(id, { isDefault: true });
  }

  async countByUserId(userId: string): Promise<number> {
    return await this.typeormRepository.count({ where: { userId } });
  }
}
