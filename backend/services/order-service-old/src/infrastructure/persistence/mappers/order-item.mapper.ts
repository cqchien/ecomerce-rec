import { OrderItemModel } from '../../../domain/models/order-item.model';
import { OrderItemEntity } from '../entities/order-item.entity';

export class OrderItemMapper {
  static toDomain(entity: OrderItemEntity): OrderItemModel {
    if (!entity) {
      return null;
    }

    const model = new OrderItemModel();
    model.id = entity.id;
    model.orderId = entity.orderId;
    model.productId = entity.productId;
    model.variantId = entity.variantId;
    model.name = entity.name;
    model.image = entity.image;
    model.sku = entity.sku;
    model.quantity = entity.quantity;
    model.unitPrice = Number(entity.unitPrice);
    model.totalPrice = Number(entity.totalPrice);
    model.attributes = entity.attributes;
    model.createdAt = entity.createdAt;
    model.updatedAt = entity.updatedAt;

    return model;
  }

  static toEntity(model: OrderItemModel): OrderItemEntity {
    if (!model) {
      return null;
    }

    const entity = new OrderItemEntity();
    entity.id = model.id;
    entity.orderId = model.orderId;
    entity.productId = model.productId;
    entity.variantId = model.variantId;
    entity.name = model.name;
    entity.image = model.image;
    entity.sku = model.sku;
    entity.quantity = model.quantity;
    entity.unitPrice = model.unitPrice;
    entity.totalPrice = model.totalPrice;
    entity.attributes = model.attributes;
    entity.createdAt = model.createdAt;
    entity.updatedAt = model.updatedAt;

    return entity;
  }

  static toDomainList(entities: OrderItemEntity[]): OrderItemModel[] {
    return entities?.map(entity => this.toDomain(entity)) || [];
  }

  static toEntityList(models: OrderItemModel[]): OrderItemEntity[] {
    return models?.map(model => this.toEntity(model)) || [];
  }
}
