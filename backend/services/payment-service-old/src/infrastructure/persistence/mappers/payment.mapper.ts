import { Payment } from '../../../domain/models/payment.model';
import { PaymentEntity } from '../entities/payment.entity';

/**
 * Mapper to convert between Payment domain model and PaymentEntity (TypeORM)
 */
export class PaymentMapper {
  /**
   * Convert TypeORM entity to domain model
   */
  static toDomain(entity: PaymentEntity): Payment {
    return new Payment(
      entity.id,
      entity.orderId,
      entity.userId,
      Number(entity.amount),
      entity.currency,
      entity.status,
      entity.paymentMethod,
      entity.provider,
      entity.paymentIntentId,
      entity.providerPaymentId,
      entity.providerCustomerId,
      entity.cardLast4,
      entity.cardBrand,
      entity.cardExpMonth,
      entity.cardExpYear,
      entity.paidAt,
      entity.failedAt,
      entity.cancelledAt,
      entity.failureCode,
      entity.failureMessage,
      Number(entity.refundedAmount),
      entity.metadata || {},
      entity.description,
      entity.receiptUrl,
      entity.receiptEmail,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  /**
   * Convert domain model to TypeORM entity
   */
  static toEntity(model: Payment): PaymentEntity {
    const entity = new PaymentEntity();
    entity.id = model.id;
    entity.orderId = model.orderId;
    entity.userId = model.userId;
    entity.amount = model.amount;
    entity.currency = model.currency;
    entity.status = model.status;
    entity.paymentMethod = model.paymentMethod;
    entity.provider = model.provider;
    entity.paymentIntentId = model.paymentIntentId;
    entity.providerPaymentId = model.providerPaymentId;
    entity.providerCustomerId = model.providerCustomerId;
    entity.cardLast4 = model.cardLast4;
    entity.cardBrand = model.cardBrand;
    entity.cardExpMonth = model.cardExpMonth;
    entity.cardExpYear = model.cardExpYear;
    entity.paidAt = model.paidAt;
    entity.failedAt = model.failedAt;
    entity.cancelledAt = model.cancelledAt;
    entity.failureCode = model.failureCode;
    entity.failureMessage = model.failureMessage;
    entity.refundedAmount = model.refundedAmount;
    entity.metadata = model.metadata;
    entity.description = model.description;
    entity.receiptUrl = model.receiptUrl;
    entity.receiptEmail = model.receiptEmail;
    if (model.createdAt) entity.createdAt = model.createdAt;
    if (model.updatedAt) entity.updatedAt = model.updatedAt;
    return entity;
  }
}
