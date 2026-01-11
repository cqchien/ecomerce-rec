import { OrderStatus } from '../common/constants';

export class OrderStatusHistoryModel {
  id: string;
  orderId: string;
  status: OrderStatus;
  note: string;
  updatedBy: string;
  metadata: Record<string, any>;
  createdAt: Date;
}
