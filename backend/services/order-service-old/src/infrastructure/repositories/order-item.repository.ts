import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderItemModel } from '../../domain/models/order-item.model';
import { IOrderItemRepository } from '../../domain/interfaces/order-item-repository.interface';
import { OrderItemEntity } from '../persistence/entities/order-item.entity';
import { OrderItemMapper } from '../persistence/mappers/order-item.mapper';

/**
 * Order Item Repository Implementation (Infrastructure Layer)
 * Implements IOrderItemRepository using TypeORM
 * Converts between TypeORM entities and domain models
 */
@Injectable()
export class OrderItemRepository implements IOrderItemRepository {
  constructor(
    @InjectRepository(OrderItemEntity)
    private readonly typeormRepository: Repository<OrderItemEntity>,
  ) {}

  async findById(id: string): Promise<OrderItemModel | null> {
    const entity = await this.typeormRepository.findOne({ where: { id } });
    return entity ? OrderItemMapper.toDomain(entity) : null;
  }

  async findByOrderId(orderId: string): Promise<OrderItemModel[]> {
    const entities = await this.typeormRepository.find({ where: { orderId } });
    return entities.map(entity => OrderItemMapper.toDomain(entity));
  }

  async save(orderItem: OrderItemModel): Promise<OrderItemModel> {
    const entity = OrderItemMapper.toEntity(orderItem);
    const saved = await this.typeormRepository.save(entity);
    return OrderItemMapper.toDomain(saved);
  }

  async saveMany(orderItems: OrderItemModel[]): Promise<OrderItemModel[]> {
    const entities = orderItems.map(item => OrderItemMapper.toEntity(item));
    const saved = await this.typeormRepository.save(entities);
    return saved.map(entity => OrderItemMapper.toDomain(entity));
  }

  async delete(id: string): Promise<void> {
    await this.typeormRepository.delete(id);
  }

  async deleteByOrderId(orderId: string): Promise<void> {
    await this.typeormRepository.delete({ orderId });
  }
}
