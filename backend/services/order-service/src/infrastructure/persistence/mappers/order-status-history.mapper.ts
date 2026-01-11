import { OrderStatusHistoryModel } from '../../../domain/models/order-status-history.model';
import { OrderStatusHistoryEntity } from '../entities/order-status-history.entity';

export class OrderStatusHistoryMapper {
  static toDomain(entity: OrderStatusHistoryEntity): OrderStatusHistoryModel {
    if (!entity) {
      return null;
    }

    const model = new OrderStatusHistoryModel();
    model.id = entity.id;
    model.orderId = entity.orderId;
    model.status = entity.status;
    model.note = entity.note;
    model.updatedBy = entity.updatedBy;
    model.metadata = entity.metadata;
    model.createdAt = entity.createdAt;

    return model;
  }

  static toEntity(model: OrderStatusHistoryModel): OrderStatusHistoryEntity {
    if (!model) {
      return null;
    }

    const entity = new OrderStatusHistoryEntity();
    entity.id = model.id;
    entity.orderId = model.orderId;
    entity.status = model.status;
    entity.note = model.note;
    entity.updatedBy = model.updatedBy;
    entity.metadata = model.metadata;
    entity.createdAt = model.createdAt;

    return entity;
  }

  static toDomainList(entities: OrderStatusHistoryEntity[]): OrderStatusHistoryModel[] {
    return entities?.map(entity => this.toDomain(entity)) || [];
  }

  static toEntityList(models: OrderStatusHistoryModel[]): OrderStatusHistoryEntity[] {
    return models?.map(model => this.toEntity(model)) || [];
  }
}
