import { Address } from '../../../domain/models/address.model';
import { AddressEntity } from '../entities/address.entity';

/**
 * Mapper for Address domain model and AddressEntity.
 * Handles conversion between domain and persistence layers.
 */
export class AddressMapper {
  /**
   * Convert AddressEntity to Address domain model.
   */
  static toDomain(entity: AddressEntity): Address {
    return new Address({
      id: entity.id,
      userId: entity.userId,
      firstName: entity.firstName,
      lastName: entity.lastName,
      addressLine1: entity.addressLine1,
      addressLine2: entity.addressLine2 || null,
      city: entity.city,
      state: entity.state,
      postalCode: entity.postalCode,
      country: entity.country,
      phone: entity.phone,
      isDefault: entity.isDefault,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt || null,
    });
  }

  /**
   * Convert Address domain model to AddressEntity.
   * ID is only set if it exists (for updates), otherwise TypeORM generates it.
   */
  static toEntity(model: Address): AddressEntity {
    const entity = new AddressEntity();
    // Only set ID if it exists, otherwise TypeORM auto-generates it
    if (model.id !== undefined) {
      entity.id = model.id;
    }
    entity.userId = model.userId;
    entity.firstName = model.firstName;
    entity.lastName = model.lastName;
    entity.addressLine1 = model.addressLine1;
    entity.addressLine2 = model.addressLine2 ?? null;
    entity.city = model.city;
    entity.state = model.state;
    entity.postalCode = model.postalCode;
    entity.country = model.country;
    entity.phone = model.phone;
    entity.isDefault = model.isDefault;
    entity.createdAt = model.createdAt;
    entity.updatedAt = model.updatedAt;
    entity.deletedAt = model.deletedAt ?? null;
    return entity;
  }

  /**
   * Convert array of AddressEntity to array of Address domain models.
   */
  static toDomainList(entities: AddressEntity[]): Address[] {
    return entities.map(entity => this.toDomain(entity));
  }

  /**
   * Convert array of Address domain models to array of AddressEntity.
   */
  static toEntityList(models: Address[]): AddressEntity[] {
    return models.map(model => this.toEntity(model));
  }
}
