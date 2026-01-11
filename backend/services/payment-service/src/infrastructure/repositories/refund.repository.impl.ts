import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Refund } from '../../domain/models/refund.model';
import { IRefundRepository } from '../../domain/interfaces/refund.repository.interface';
import { RefundEntity } from '../persistence/entities/refund.entity';
import { RefundMapper } from '../persistence/mappers/refund.mapper';
import { v4 as uuidv4 } from 'uuid';
import { RefundStatus } from '../../common/constants';

/**
 * Refund Repository Implementation (Infrastructure Layer)
 * Implements IRefundRepository using TypeORM
 * Converts between TypeORM entities and domain models
 */
@Injectable()
export class RefundRepository implements IRefundRepository {
  constructor(
    @InjectRepository(RefundEntity)
    private readonly typeormRepository: Repository<RefundEntity>,
  ) {}

  create(data: Partial<Refund>): Refund {
    return new Refund(
      data.id || uuidv4(),
      data.paymentId,
      data.amount || 0,
      data.status || RefundStatus.PENDING,
      data.reason,
      data.providerRefundId || null,
      data.refundedAt || null,
      data.failedAt || null,
      data.failureReason || null,
      data.notes || null,
      data.requestedBy || null,
      data.processedBy || null,
      data.metadata || {},
    );
  }

  async findById(id: string): Promise<Refund | null> {
    const entity = await this.typeormRepository.findOne({
      where: { id },
    });
    return entity ? RefundMapper.toDomain(entity) : null;
  }

  async findByPaymentId(paymentId: string): Promise<Refund[]> {
    const entities = await this.typeormRepository.find({
      where: { paymentId },
      order: { createdAt: 'DESC' },
    });
    return entities.map(entity => RefundMapper.toDomain(entity));
  }

  async findOneByPaymentIdAndStatus(paymentId: string, status: string): Promise<Refund | null> {
    const entity = await this.typeormRepository.findOne({
      where: { paymentId, status: status as RefundStatus },
    });
    return entity ? RefundMapper.toDomain(entity) : null;
  }

  async save(refund: Refund): Promise<Refund> {
    const entity = RefundMapper.toEntity(refund);
    const saved = await this.typeormRepository.save(entity);
    return RefundMapper.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.typeormRepository.delete(id);
  }
}
