import { WishlistItem } from '../../../domain/models/wishlist-item.model';
import { WishlistItemEntity } from '../entities/wishlist-item.entity';

/**
 * Mapper for WishlistItem domain model and WishlistItemEntity.
 * Handles conversion between domain and persistence layers.
 */
export class WishlistItemMapper {
  /**
   * Convert WishlistItemEntity to WishlistItem domain model.
   */
  static toDomain(entity: WishlistItemEntity): WishlistItem {
    return new WishlistItem({
      id: entity.id,
      userId: entity.userId,
      productId: entity.productId,
      addedAt: entity.addedAt,
    });
  }

  /**
   * Convert WishlistItem domain model to WishlistItemEntity.
   * ID is only set if it exists (for updates), otherwise TypeORM generates it.
   */
  static toEntity(model: WishlistItem): WishlistItemEntity {
    const entity = new WishlistItemEntity();
    // Only set ID if it exists, otherwise TypeORM auto-generates it
    if (model.id !== undefined) {
      entity.id = model.id;
    }
    entity.userId = model.userId;
    entity.productId = model.productId;
    entity.addedAt = model.addedAt;
    return entity;
  }

  /**
   * Convert array of WishlistItemEntity to array of WishlistItem domain models.
   */
  static toDomainList(entities: WishlistItemEntity[]): WishlistItem[] {
    return entities.map(entity => this.toDomain(entity));
  }

  /**
   * Convert array of WishlistItem domain models to array of WishlistItemEntity.
   */
  static toEntityList(models: WishlistItem[]): WishlistItemEntity[] {
    return models.map(model => this.toEntity(model));
  }
}
