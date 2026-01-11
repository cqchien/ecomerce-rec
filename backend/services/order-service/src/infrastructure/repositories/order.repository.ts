import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity } from '../persistence/entities/order.entity';
import { OrderModel } from '../../domain/models/order.model';
import { OrderFiltersDto } from '../../application/dtos/order-filters.dto';
import { IOrderRepository } from '../../domain/interfaces/order.repository.interface';
import { OrderMapper } from '../persistence/mappers/order.mapper';

@Injectable()
export class OrderRepository implements IOrderRepository {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly repository: Repository<OrderEntity>,
  ) {}

  async create(orderData: Partial<OrderModel>): Promise<OrderModel> {
    const entity = OrderMapper.toEntity(orderData as OrderModel);
    const savedEntity = await this.repository.save(entity);
    return OrderMapper.toDomain(savedEntity);
  }

  async findById(id: string): Promise<OrderModel | null> {
    const entity = await this.repository.findOne({
      where: { id },
      relations: ['items', 'statusHistory'],
      order: { 'statusHistory.createdAt': 'DESC' },
    });
    return OrderMapper.toDomain(entity);
  }

  async findByOrderNumber(orderNumber: string): Promise<OrderModel | null> {
    const entity = await this.repository.findOne({
      where: { orderNumber },
      relations: ['items', 'statusHistory'],
    });
    return OrderMapper.toDomain(entity);
  }

  async findByUserId(
    userId: string,
    filters?: OrderFiltersDto,
  ): Promise<{ orders: OrderModel[]; total: number }> {
    const query = this.repository.createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('order.statusHistory', 'statusHistory')
      .where('order.userId = :userId', { userId });

    if (filters?.status) {
      query.andWhere('order.status = :status', { status: filters.status });
    }

    if (filters?.startDate && filters?.endDate) {
      query.andWhere('order.createdAt BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    }

    const total = await query.getCount();

    if (filters?.limit) {
      query.limit(filters.limit);
    }

    if (filters?.offset) {
      query.offset(filters.offset);
    }

    query.orderBy('order.createdAt', 'DESC');

    const entities = await query.getMany();

    return { orders: OrderMapper.toDomainList(entities), total };
  }

  async update(id: string, data: Partial<OrderModel>): Promise<OrderModel> {
    const entity = OrderMapper.toEntity(data as OrderModel);
    await this.repository.update(id, entity);
    return this.findById(id);
  }

  async save(order: OrderModel): Promise<OrderModel> {
    const entity = OrderMapper.toEntity(order);
    const savedEntity = await this.repository.save(entity);
    return OrderMapper.toDomain(savedEntity);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
