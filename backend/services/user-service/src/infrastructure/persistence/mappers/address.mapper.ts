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
    return new Address(
      entity.id,
      entity.userId,
      entity.firstName,
      entity.lastName,
      entity.addressLine1,
      entity.addressLine2 || null,
      entity.city,
      entity.state,
      entity.postalCode,
      entity.country,
      entity.phone,
      entity.isDefault,
      entity.createdAt,
      entity.updatedAt,
      entity.deletedAt || null,
    );
  }

  /**
   * Convert Address domain model to AddressEntity.
   */
  static toEntity(model: Address): AddressEntity {
    const entity = new AddressEntity();
    entity.id = model.id;
    entity.userId = model.userId;
    entity.firstName = model.firstName;
    entity.lastName = model.lastName;
    entity.addressLine1 = model.addressLine1;
    entity.addressLine2 = model.addressLine2;
    entity.city = model.city;
    entity.state = model.state;
    entity.postalCode = model.postalCode;
    entity.country = model.country;
    entity.phone = model.phone;
    entity.isDefault = model.isDefault;
    entity.createdAt = model.createdAt;
    entity.updatedAt = model.updatedAt;
    entity.deletedAt = model.deletedAt;
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
