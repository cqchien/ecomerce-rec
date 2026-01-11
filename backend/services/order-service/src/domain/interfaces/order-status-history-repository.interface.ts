import { OrderStatusHistoryModel } from '../models/order-status-history.model';

/**
 * Order Status History Repository Interface (Domain Layer)
 * Defines contract for order status history data access operations
 * Works with pure domain models, not TypeORM entities
 */
export interface IOrderStatusHistoryRepository {
  /**
   * Find status history by ID
   */
  findById(id: string): Promise<OrderStatusHistoryModel | null>;

  /**
   * Find all status history for an order
   */
  findByOrderId(orderId: string): Promise<OrderStatusHistoryModel[]>;

  /**
   * Save status history entry
   */
  save(history: OrderStatusHistoryModel): Promise<OrderStatusHistoryModel>;

  /**
   * Delete status history entry
   */
  delete(id: string): Promise<void>;
}
