import { OrderItemModel } from '../models/order-item.model';

/**
 * Order Item Repository Interface (Domain Layer)
 * Defines contract for order item data access operations
 * Works with pure domain models, not TypeORM entities
 */
export interface IOrderItemRepository {
  /**
   * Find order item by ID
   */
  findById(id: string): Promise<OrderItemModel | null>;

  /**
   * Find all items for an order
   */
  findByOrderId(orderId: string): Promise<OrderItemModel[]>;

  /**
   * Save order item
   */
  save(orderItem: OrderItemModel): Promise<OrderItemModel>;

  /**
   * Save multiple order items
   */
  saveMany(orderItems: OrderItemModel[]): Promise<OrderItemModel[]>;

  /**
   * Delete order item
   */
  delete(id: string): Promise<void>;

  /**
   * Delete all items for an order
   */
  deleteByOrderId(orderId: string): Promise<void>;
}
