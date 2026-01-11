import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../../domain/models/payment.model';
import { IPaymentRepository } from '../../domain/interfaces/payment.repository.interface';
import { PaymentEntity } from '../persistence/entities/payment.entity';
import { PaymentMapper } from '../persistence/mappers/payment.mapper';
import { v4 as uuidv4 } from 'uuid';
import { PaymentStatus } from '../../common/constants';

/**
 * Payment Repository Implementation (Infrastructure Layer)
 * Implements IPaymentRepository using TypeORM
 * Converts between TypeORM entities and domain models
 */
@Injectable()
export class PaymentRepository implements IPaymentRepository {
  constructor(
    @InjectRepository(PaymentEntity)
    private readonly typeormRepository: Repository<PaymentEntity>,
  ) {}

  create(data: Partial<Payment>): Payment {
    return new Payment(
      data.id || uuidv4(),
      data.orderId,
      data.userId,
      data.amount || 0,
      data.currency,
      data.status || PaymentStatus.PENDING,
      data.paymentMethod,
      data.provider,
      data.paymentIntentId || null,
      data.providerPaymentId || null,
      data.providerCustomerId || null,
      data.cardLast4 || null,
      data.cardBrand || null,
      data.cardExpMonth || null,
      data.cardExpYear || null,
      data.paidAt || null,
      data.failedAt || null,
      data.cancelledAt || null,
      data.failureCode || null,
      data.failureMessage || null,
      data.refundedAmount || 0,
      data.metadata || {},
      data.description || null,
      data.receiptUrl || null,
      data.receiptEmail || null,
    );
  }

  async findById(id: string): Promise<Payment | null> {
    const entity = await this.typeormRepository.findOne({
      where: { id },
      relations: ['refunds'],
    });
    return entity ? PaymentMapper.toDomain(entity) : null;
  }

  async findByOrderId(orderId: string): Promise<Payment | null> {
    const entity = await this.typeormRepository.findOne({
      where: { orderId },
      relations: ['refunds'],
    });
    return entity ? PaymentMapper.toDomain(entity) : null;
  }

  async findByPaymentIntentId(paymentIntentId: string): Promise<Payment | null> {
    const entity = await this.typeormRepository.findOne({
      where: { paymentIntentId },
      relations: ['refunds'],
    });
    return entity ? PaymentMapper.toDomain(entity) : null;
  }

  async findByProviderPaymentId(providerPaymentId: string): Promise<Payment | null> {
    const entity = await this.typeormRepository.findOne({
      where: { providerPaymentId },
      relations: ['refunds'],
    });
    return entity ? PaymentMapper.toDomain(entity) : null;
  }

  async findByUserId(userId: string, limit: number = 20, offset: number = 0): Promise<{ payments: Payment[]; total: number }> {
    const [entities, total] = await this.typeormRepository.findAndCount({
      where: { userId },
      relations: ['refunds'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    const payments = entities.map(entity => PaymentMapper.toDomain(entity));
    return { payments, total };
  }

  async save(payment: Payment): Promise<Payment> {
    const entity = PaymentMapper.toEntity(payment);
    const saved = await this.typeormRepository.save(entity);
    return PaymentMapper.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.typeormRepository.delete(id);
  }
}
