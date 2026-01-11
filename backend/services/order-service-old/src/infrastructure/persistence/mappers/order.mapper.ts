import { OrderModel } from '../../../domain/models/order.model';
import { OrderEntity } from '../entities/order.entity';
import { OrderItemMapper } from './order-item.mapper';
import { OrderStatusHistoryMapper } from './order-status-history.mapper';

export class OrderMapper {
  static toDomain(entity: OrderEntity): OrderModel {
    if (!entity) {
      return null;
    }

    const model = new OrderModel();
    model.id = entity.id;
    model.orderNumber = entity.orderNumber;
    model.userId = entity.userId;
    model.items = entity.items?.map(item => OrderItemMapper.toDomain(item)) || [];
    model.statusHistory = entity.statusHistory?.map(history => OrderStatusHistoryMapper.toDomain(history)) || [];
    model.subtotal = Number(entity.subtotal);
    model.shippingCost = Number(entity.shippingCost);
    model.taxAmount = Number(entity.taxAmount);
    model.discountAmount = Number(entity.discountAmount);
    model.total = Number(entity.total);
    model.status = entity.status;
    model.paymentMethod = entity.paymentMethod;
    model.paymentIntentId = entity.paymentIntentId;
    model.paymentId = entity.paymentId;
    model.paidAt = entity.paidAt;
    model.shippingAddress = entity.shippingAddress;
    model.billingAddress = entity.billingAddress;
    model.trackingNumber = entity.trackingNumber;
    model.carrier = entity.carrier;
    model.shippedAt = entity.shippedAt;
    model.estimatedDelivery = entity.estimatedDelivery;
    model.deliveredAt = entity.deliveredAt;
    model.cancelledAt = entity.cancelledAt;
    model.cancellationReason = entity.cancellationReason;
    model.cancelledBy = entity.cancelledBy;
    model.customerNotes = entity.customerNotes;
    model.internalNotes = entity.internalNotes;
    model.createdAt = entity.createdAt;
    model.updatedAt = entity.updatedAt;
    model.deletedAt = entity.deletedAt;

    return model;
  }

  static toEntity(model: OrderModel): OrderEntity {
    if (!model) {
      return null;
    }

    const entity = new OrderEntity();
    entity.id = model.id;
    entity.orderNumber = model.orderNumber;
    entity.userId = model.userId;
    entity.items = model.items?.map(item => OrderItemMapper.toEntity(item)) || [];
    entity.statusHistory = model.statusHistory?.map(history => OrderStatusHistoryMapper.toEntity(history)) || [];
    entity.subtotal = model.subtotal;
    entity.shippingCost = model.shippingCost;
    entity.taxAmount = model.taxAmount;
    entity.discountAmount = model.discountAmount;
    entity.total = model.total;
    entity.status = model.status;
    entity.paymentMethod = model.paymentMethod;
    entity.paymentIntentId = model.paymentIntentId;
    entity.paymentId = model.paymentId;
    entity.paidAt = model.paidAt;
    entity.shippingAddress = model.shippingAddress;
    entity.billingAddress = model.billingAddress;
    entity.trackingNumber = model.trackingNumber;
    entity.carrier = model.carrier;
    entity.shippedAt = model.shippedAt;
    entity.estimatedDelivery = model.estimatedDelivery;
    entity.deliveredAt = model.deliveredAt;
    entity.cancelledAt = model.cancelledAt;
    entity.cancellationReason = model.cancellationReason;
    entity.cancelledBy = model.cancelledBy;
    entity.customerNotes = model.customerNotes;
    entity.internalNotes = model.internalNotes;
    entity.createdAt = model.createdAt;
    entity.updatedAt = model.updatedAt;
    entity.deletedAt = model.deletedAt;

    return entity;
  }

  static toDomainList(entities: OrderEntity[]): OrderModel[] {
    return entities?.map(entity => this.toDomain(entity)) || [];
  }

  static toEntityList(models: OrderModel[]): OrderEntity[] {
    return models?.map(model => this.toEntity(model)) || [];
  }
}
