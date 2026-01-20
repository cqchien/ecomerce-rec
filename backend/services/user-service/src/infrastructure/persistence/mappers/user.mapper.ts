import { User } from '../../../domain/models/user.model';
import { UserEntity } from '../entities/user.entity';
import { AddressMapper } from './address.mapper';
import { WishlistItemMapper } from './wishlist-item.mapper';

/**
 * Mapper for User domain model and UserEntity.
 * Handles conversion between domain and persistence layers.
 */
export class UserMapper {
  /**
   * Convert UserEntity to User domain model.
   */
  static toDomain(entity: UserEntity): User {
    const addresses = entity.addresses
      ? entity.addresses.map(addr => AddressMapper.toDomain(addr))
      : [];

    const wishlist = entity.wishlist
      ? entity.wishlist.map(item => WishlistItemMapper.toDomain(item))
      : [];

    return new User({
      id: entity.id,
      email: entity.email,
      name: entity.name,
      phone: entity.phone || null,
      avatar: entity.avatar || null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      deletedAt: entity.deletedAt || null,
      addresses,
      wishlist,
    });
  }

  /**
   * Convert User domain model to UserEntity.
   * ID is only set if it exists (for updates), otherwise TypeORM generates it.
   */
  static toEntity(model: User): UserEntity {
    const entity = new UserEntity();
    // Only set ID if it exists, otherwise TypeORM auto-generates it
    if (model.id !== undefined) {
      entity.id = model.id;
    }
    entity.email = model.email;
    entity.name = model.name;
    entity.phone = model.phone ?? null;
    entity.avatar = model.avatar ?? null;
    entity.createdAt = model.createdAt;
    entity.updatedAt = model.updatedAt;
    entity.deletedAt = model.deletedAt ?? null;

    // Don't set empty arrays - causes issues with UUID validation
    // Relationships will be loaded/saved separately if needed

    return entity;
  }

  /**
   * Convert array of UserEntity to array of User domain models.
   */
  static toDomainList(entities: UserEntity[]): User[] {
    return entities.map(entity => this.toDomain(entity));
  }

  /**
   * Convert array of User domain models to array of UserEntity.
   */
  static toEntityList(models: User[]): UserEntity[] {
    return models.map(model => this.toEntity(model));
  }
}
