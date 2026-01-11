import { CartItem } from '../../../domain/models/cart-item.model';
import { CartItemEntity } from '../entities/cart-item.entity';

/**
 * Mapper to convert between CartItem domain model and CartItemEntity (TypeORM)
 */
export class CartItemMapper {
  /**
   * Convert TypeORM entity to domain model
   */
  static toDomain(entity: CartItemEntity): CartItem {
    return new CartItem(
      entity.id,
      entity.cartId,
      entity.productId,
      entity.name,
      Number(entity.unitPrice),
      entity.quantity,
      Number(entity.totalPrice),
      entity.variantId,
      entity.image,
      entity.sku,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  /**
   * Convert domain model to TypeORM entity
   */
  static toEntity(model: CartItem): CartItemEntity {
    const entity = new CartItemEntity();
    entity.id = model.id;
    entity.cartId = model.cartId;
    entity.productId = model.productId;
    entity.variantId = model.variantId;
    entity.name = model.name;
    entity.image = model.image;
    entity.sku = model.sku;
    entity.quantity = model.quantity;
    entity.unitPrice = model.unitPrice;
    entity.totalPrice = model.totalPrice;
    if (model.createdAt) entity.createdAt = model.createdAt;
    if (model.updatedAt) entity.updatedAt = model.updatedAt;
    return entity;
  }
}
