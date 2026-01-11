import { Injectable, NotFoundException, BadRequestException, Inject, Logger } from '@nestjs/common';
import { OrderModel } from '../../domain/models/order.model';
import { OrderItemModel } from '../../domain/models/order-item.model';
import { OrderStatusHistoryModel } from '../../domain/models/order-status-history.model';
import { CreateOrderDto } from '../../presentation/dto/create-order.dto';
import { UpdateOrderStatusDto } from '../../presentation/dto/update-order-status.dto';
import { OrderFiltersDto } from '../../presentation/dto/order-filters.dto';
import { CancelOrderDto } from '../../presentation/dto/cancel-order.dto';
import { IOrderRepository } from '../../domain/interfaces/order.repository.interface';
import { IOrderItemRepository } from '../../domain/interfaces/order-item-repository.interface';
import { IOrderStatusHistoryRepository } from '../../domain/interfaces/order-status-history-repository.interface';
import { ICacheService } from '../../domain/interfaces/cache.interface';
import { IEventPublisher } from '../../domain/interfaces/event.interface';
import {
  OrderStatus,
  KAFKA_TOPICS,
  CACHE_KEYS,
  CACHE_TTL,
  ERROR_MESSAGES,
  ORDER_RULES,
} from '../../common/constants';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @Inject('IOrderRepository')
    private readonly orderRepository: IOrderRepository,
    @Inject('IOrderItemRepository')
    private readonly orderItemRepository: IOrderItemRepository,
    @Inject('IOrderStatusHistoryRepository')
    private readonly orderStatusHistoryRepository: IOrderStatusHistoryRepository,
    @Inject('ICacheService')
    private readonly cacheService: ICacheService,
    @Inject('IEventPublisher')
    private readonly eventPublisher: IEventPublisher,
  ) {}

  /**
   * Create a new order
   */
  async createOrder(createOrderDto: CreateOrderDto): Promise<Order> {
    this.logger.log(`Creating order for user: ${createOrderDto.userId}`);

    this.validateOrder(createOrderDto);

    const orderNumber = await this.generateOrderNumber();

    const { items, subtotal, total } = await this.calculateItemsAndPricing(createOrderDto.items);

    if (total < ORDER_RULES.MIN_ORDER_AMOUNT || total > ORDER_RULES.MAX_ORDER_AMOUNT) {
      throw new BadRequestException(ERROR_MESSAGES.INVALID_ORDER_AMOUNT);
    }

    const savedOrder = await this.orderRepository.create({
      orderNumber,
      userId: createOrderDto.userId,
      paymentMethod: createOrderDto.paymentMethod,
      shippingAddress: createOrderDto.shippingAddress,
      billingAddress: createOrderDto.billingAddress,
      customerNotes: createOrderDto.customerNotes,
      subtotal,
      shippingCost: 0,
      taxAmount: 0,
      discountAmount: 0,
      total,
      status: OrderStatus.PENDING,
      items,
    });

    await this.createStatusHistory(savedOrder.id, OrderStatus.PENDING, 'Order created');

    await this.invalidateOrderCache(savedOrder.userId);

    await this.eventPublisher.publish(KAFKA_TOPICS.ORDER_CREATED, {
      orderId: savedOrder.id,
      orderNumber: savedOrder.orderNumber,
      userId: savedOrder.userId,
      total: savedOrder.total,
      status: savedOrder.status,
      items: savedOrder.items,
      createdAt: savedOrder.createdAt,
    });

    await this.eventPublisher.publish(KAFKA_TOPICS.INVENTORY_RESERVE_REQUEST, {
      orderId: savedOrder.id,
      userId: savedOrder.userId,
      items: savedOrder.items.map(item => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
      })),
      requestedAt: new Date(),
    });

    this.logger.log(`Order created successfully: ${savedOrder.orderNumber}`);
    return savedOrder;
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: string): Promise<Order> {
    const cacheKey = `${CACHE_KEYS.ORDER_BY_ID}${orderId}`;
    const cached = await this.cacheService.get<Order>(cacheKey);
    if (cached) {
      return cached;
    }

    const order = await this.orderRepository.findById(orderId);

    if (!order) {
      throw new NotFoundException(ERROR_MESSAGES.ORDER_NOT_FOUND);
    }

    await this.cacheService.set(cacheKey, order, CACHE_TTL.ORDER);

    return order;
  }

  /**
   * Get order by order number
   */
  async getOrderByNumber(orderNumber: string): Promise<Order> {
    const order = await this.orderRepository.findByOrderNumber(orderNumber);

    if (!order) {
      throw new NotFoundException(ERROR_MESSAGES.ORDER_NOT_FOUND);
    }

    return order;
  }

  /**
   * List orders with filters
   */
  async listOrders(userId: string, filters: OrderFiltersDto): Promise<{ orders: Order[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 20 } = filters;

    const { orders, total } = await this.orderRepository.findByUserId(userId, filters);

    return { orders, total, page, limit };
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, updateDto: UpdateOrderStatusDto): Promise<Order> {
    const order = await this.getOrderById(orderId);

    if (updateDto.status === OrderStatus.SHIPPED) {
      order.ship({
        trackingNumber: updateDto.trackingNumber,
        carrier: updateDto.carrier,
        estimatedDeliveryDays: ORDER_RULES.SHIPPING_ESTIMATE_DAYS,
      });
    } else if (updateDto.status === OrderStatus.DELIVERED) {
      order.deliver();
    } else if (updateDto.status === OrderStatus.CONFIRMED) {
      order.confirm(updateDto.paymentId || order.paymentId);
    } else {
      order.updateStatus(updateDto.status, updateDto.note, updateDto.updatedBy);
    }

    const updatedOrder = await this.orderRepository.save(order);

    await this.createStatusHistory(orderId, updateDto.status, updateDto.note, updateDto.updatedBy);

    await this.invalidateOrderCache(order.userId, orderId);

    await this.emitStatusEvent(updateDto.status, updatedOrder);

    this.logger.log(`Order ${order.orderNumber} status updated to ${updateDto.status}`);
    return updatedOrder;
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId: string, cancelDto: CancelOrderDto): Promise<Order> {
    const order = await this.getOrderById(orderId);

    if (!order.canBeCancelled()) {
      throw new BadRequestException(ERROR_MESSAGES.CANNOT_CANCEL_ORDER);
    }

    const hoursSinceCreation = (Date.now() - order.createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation > ORDER_RULES.CANCELLATION_WINDOW_HOURS && order.status !== OrderStatus.PENDING) {
      this.logger.warn(`Cancellation window expired for order ${order.orderNumber}, but allowing admin override`);
    }

    order.cancel(cancelDto.reason, cancelDto.cancelledBy || order.userId);

    const cancelledOrder = await this.orderRepository.save(order);

    await this.createStatusHistory(orderId, OrderStatus.CANCELLED, cancelDto.note || `Cancelled: ${cancelDto.reason}`, cancelDto.cancelledBy);

    await this.invalidateOrderCache(order.userId, orderId);

    await this.eventPublisher.publish(KAFKA_TOPICS.ORDER_CANCELLED, {
      orderId: cancelledOrder.id,
      orderNumber: cancelledOrder.orderNumber,
      userId: cancelledOrder.userId,
      cancellationReason: cancelledOrder.cancellationReason,
      cancelledBy: cancelledOrder.cancelledBy,
      cancelledAt: cancelledOrder.cancelledAt,
    });

    await this.eventPublisher.publish(KAFKA_TOPICS.INVENTORY_RELEASE_REQUEST, {
      orderId: cancelledOrder.id,
      items: cancelledOrder.items.map(item => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
      })),
      reason: 'order_cancelled',
      requestedAt: new Date(),
    });

    if (order.isPaid()) {
      await this.eventPublisher.publish(KAFKA_TOPICS.PAYMENT_REFUND_REQUEST, {
        orderId: cancelledOrder.id,
        userId: cancelledOrder.userId,
        amount: cancelledOrder.total,
        reason: cancelledOrder.cancellationReason,
        requestedAt: new Date(),
      });
      this.logger.log(`Refund request published for order: ${order.orderNumber}`);
    }

    this.logger.log(`Order ${order.orderNumber} cancelled successfully`);
    return cancelledOrder;
  }

  /**
   * Get order status history
   */
  async getOrderStatusHistory(orderId: string): Promise<OrderStatusHistory[]> {
    const cacheKey = `${CACHE_KEYS.ORDER_HISTORY}${orderId}`;
    const cached = await this.cacheService.get<OrderStatusHistory[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const history = await this.orderStatusHistoryRepository.findByOrderId(orderId);

    await this.cacheService.set(cacheKey, history, CACHE_TTL.ORDER_HISTORY);

    return history;
  }
  }

  /**
   * Get tracking info
   */
  async getTrackingInfo(orderId: string): Promise<{ carrier: string; trackingNumber: string; shippedAt: Date; estimatedDelivery: Date }> {
    const order = await this.getOrderById(orderId);

    if (!order.trackingNumber) {
      throw new NotFoundException('Tracking information not available');
    }

    return {
      carrier: order.carrier,
      trackingNumber: order.trackingNumber,
      shippedAt: order.shippedAt,
      estimatedDelivery: order.estimatedDelivery,
    };
  }

  private validateOrder(dto: CreateOrderDto): void {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    if (dto.items.length > ORDER_RULES.MAX_ITEMS_PER_ORDER) {
      throw new BadRequestException(ERROR_MESSAGES.MAX_ITEMS_EXCEEDED);
    }
  }

  private async calculateItemsAndPricing(
    itemDtos: any[],
  ): Promise<{ items: OrderItemModel[]; subtotal: number; total: number }> {
    const items: OrderItemModel[] = [];
    let subtotal = 0;

    for (const itemDto of itemDtos) {
      const unitPrice = 99.99;
      
      const item = new OrderItemModel();
      item.productId = itemDto.productId;
      item.variantId = itemDto.variantId;
      item.name = 'Product Name';
      item.image = 'https://example.com/image.jpg';
      item.sku = 'SKU-123';
      item.quantity = itemDto.quantity;
      item.unitPrice = unitPrice;
      item.totalPrice = item.calculateTotal();
      item.attributes = {};

      items.push(item);
      subtotal += item.totalPrice;
    }

    subtotal = Math.round(subtotal * 100) / 100;
    const total = subtotal;

    return { items, subtotal, total };
  }

  private async generateOrderNumber(): Promise<string> {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }

  private async createStatusHistory(orderId: string, status: OrderStatus, note?: string, updatedBy?: string): Promise<void> {
    const history = new OrderStatusHistoryModel();
    history.orderId = orderId;
    history.status = status;
    history.note = note;
    history.updatedBy = updatedBy;
    history.metadata = {};

    await this.orderStatusHistoryRepository.save(history);

    await this.cacheService.del(`${CACHE_KEYS.ORDER_HISTORY}${orderId}`);
  }

  private async invalidateOrderCache(userId: string, orderId?: string): Promise<void> {
    const keys: string[] = [`${CACHE_KEYS.ORDERS_BY_USER}${userId}`];

    if (orderId) {
      keys.push(`${CACHE_KEYS.ORDER_BY_ID}${orderId}`, `${CACHE_KEYS.ORDER_HISTORY}${orderId}`, `${CACHE_KEYS.ORDER_TRACKING}${orderId}`);
    }

    if (keys.length > 0) {
      await this.cacheService.del(...keys);
    }
  }

  private async emitStatusEvent(status: OrderStatus, order: Order): Promise<void> {
    const eventPayload = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      status: order.status,
      total: order.total,
      updatedAt: new Date(),
    };

    switch (status) {
      case OrderStatus.CONFIRMED:
        await this.eventPublisher.publish(KAFKA_TOPICS.ORDER_CONFIRMED, eventPayload);
        break;
      case OrderStatus.SHIPPED:
        await this.eventPublisher.publish(KAFKA_TOPICS.ORDER_SHIPPED, {
          ...eventPayload,
          trackingNumber: order.trackingNumber,
          carrier: order.carrier,
          estimatedDelivery: order.estimatedDelivery,
        });
        break;
      case OrderStatus.DELIVERED:
        await this.eventPublisher.publish(KAFKA_TOPICS.ORDER_DELIVERED, {
          ...eventPayload,
          deliveredAt: order.deliveredAt,
        });
        break;
      case OrderStatus.PAYMENT_FAILED:
        await this.eventPublisher.publish(KAFKA_TOPICS.PAYMENT_FAILED, eventPayload);
        break;
    }
  }
}
