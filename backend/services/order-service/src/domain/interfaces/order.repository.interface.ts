import { OrderModel } from '../models/order.model';
import { OrderFiltersDto } from '../../application/dtos/order-filters.dto';

export interface IOrderRepository {
  create(order: Partial<OrderModel>): Promise<OrderModel>;
  findById(id: string): Promise<OrderModel | null>;
  findByOrderNumber(orderNumber: string): Promise<OrderModel | null>;
  findByUserId(userId: string, filters?: OrderFiltersDto): Promise<{ orders: OrderModel[]; total: number }>;
  update(id: string, data: Partial<OrderModel>): Promise<OrderModel>;
  save(order: OrderModel): Promise<OrderModel>;
  delete(id: string): Promise<void>;
}
