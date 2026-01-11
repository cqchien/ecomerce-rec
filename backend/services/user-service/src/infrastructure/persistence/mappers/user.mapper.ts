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

    return new User(
      entity.id,
      entity.email,
      entity.name,
      entity.phone || null,
      entity.avatar || null,
      entity.createdAt,
      entity.updatedAt,
      entity.deletedAt || null,
      addresses,
      wishlist,
    );
  }

  /**
   * Convert User domain model to UserEntity.
   */
  static toEntity(model: User): UserEntity {
    const entity = new UserEntity();
    entity.id = model.id;
    entity.email = model.email;
    entity.name = model.name;
    entity.phone = model.phone;
    entity.avatar = model.avatar;
    entity.createdAt = model.createdAt;
    entity.updatedAt = model.updatedAt;
    entity.deletedAt = model.deletedAt;

    if (model.addresses && model.addresses.length > 0) {
      entity.addresses = model.addresses.map(addr => AddressMapper.toEntity(addr));
    }

    if (model.wishlist && model.wishlist.length > 0) {
      entity.wishlist = model.wishlist.map(item => WishlistItemMapper.toEntity(item));
    }

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
