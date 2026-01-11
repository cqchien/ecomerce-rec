import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderStatusHistoryModel } from '../../domain/models/order-status-history.model';
import { IOrderStatusHistoryRepository } from '../../domain/interfaces/order-status-history-repository.interface';
import { OrderStatusHistoryEntity } from '../persistence/entities/order-status-history.entity';
import { OrderStatusHistoryMapper } from '../persistence/mappers/order-status-history.mapper';

/**
 * Order Status History Repository Implementation (Infrastructure Layer)
 * Implements IOrderStatusHistoryRepository using TypeORM
 * Converts between TypeORM entities and domain models
 */
@Injectable()
export class OrderStatusHistoryRepository implements IOrderStatusHistoryRepository {
  constructor(
    @InjectRepository(OrderStatusHistoryEntity)
    private readonly typeormRepository: Repository<OrderStatusHistoryEntity>,
  ) {}

  async findById(id: string): Promise<OrderStatusHistoryModel | null> {
    const entity = await this.typeormRepository.findOne({ where: { id } });
    return entity ? OrderStatusHistoryMapper.toDomain(entity) : null;
  }

  async findByOrderId(orderId: string): Promise<OrderStatusHistoryModel[]> {
    const entities = await this.typeormRepository.find({ 
      where: { orderId },
      order: { createdAt: 'ASC' },
    });
    return entities.map(entity => OrderStatusHistoryMapper.toDomain(entity));
  }

  async save(history: OrderStatusHistoryModel): Promise<OrderStatusHistoryModel> {
    const entity = OrderStatusHistoryMapper.toEntity(history);
    const saved = await this.typeormRepository.save(entity);
    return OrderStatusHistoryMapper.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.typeormRepository.delete(id);
  }
}
