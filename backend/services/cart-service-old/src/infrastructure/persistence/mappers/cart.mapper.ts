import { Cart } from '../../../domain/models/cart.model';
import { CartEntity } from '../entities/cart.entity';
import { CartItemMapper } from './cart-item.mapper';

/**
 * Mapper to convert between Cart domain model and CartEntity (TypeORM)
 */
export class CartMapper {
  /**
   * Convert TypeORM entity to domain model
   */
  static toDomain(entity: CartEntity): Cart {
    const items = entity.items?.map(item => CartItemMapper.toDomain(item)) || [];
    
    return new Cart(
      entity.id,
      entity.userId,
      Number(entity.subtotal),
      Number(entity.discount),
      Number(entity.total),
      items,
      entity.isAbandoned,
      entity.couponCode,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  /**
   * Convert domain model to TypeORM entity
   */
  static toEntity(model: Cart): CartEntity {
    const entity = new CartEntity();
    entity.id = model.id;
    entity.userId = model.userId;
    entity.subtotal = model.subtotal;
    entity.discount = model.discount;
    entity.total = model.total;
    entity.isAbandoned = model.isAbandoned;
    entity.couponCode = model.couponCode;
    entity.items = model.items.map(item => CartItemMapper.toEntity(item));
    if (model.createdAt) entity.createdAt = model.createdAt;
    if (model.updatedAt) entity.updatedAt = model.updatedAt;
    return entity;
  }
}
