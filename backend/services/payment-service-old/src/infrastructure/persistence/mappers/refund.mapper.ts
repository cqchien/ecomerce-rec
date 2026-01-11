import { Refund } from '../../../domain/models/refund.model';
import { RefundEntity } from '../entities/refund.entity';

/**
 * Mapper to convert between Refund domain model and RefundEntity (TypeORM)
 */
export class RefundMapper {
  /**
   * Convert TypeORM entity to domain model
   */
  static toDomain(entity: RefundEntity): Refund {
    return new Refund(
      entity.id,
      entity.paymentId,
      Number(entity.amount),
      entity.status,
      entity.reason,
      entity.providerRefundId,
      entity.refundedAt,
      entity.failedAt,
      entity.failureReason,
      entity.notes,
      entity.requestedBy,
      entity.processedBy,
      entity.metadata || {},
      entity.createdAt,
      entity.updatedAt,
    );
  }

  /**
   * Convert domain model to TypeORM entity
   */
  static toEntity(model: Refund): RefundEntity {
    const entity = new RefundEntity();
    entity.id = model.id;
    entity.paymentId = model.paymentId;
    entity.amount = model.amount;
    entity.status = model.status;
    entity.reason = model.reason;
    entity.providerRefundId = model.providerRefundId;
    entity.refundedAt = model.refundedAt;
    entity.failedAt = model.failedAt;
    entity.failureReason = model.failureReason;
    entity.notes = model.notes;
    entity.requestedBy = model.requestedBy;
    entity.processedBy = model.processedBy;
    entity.metadata = model.metadata;
    if (model.createdAt) entity.createdAt = model.createdAt;
    if (model.updatedAt) entity.updatedAt = model.updatedAt;
    return entity;
  }
}
