import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpStatus, HttpCode, ValidationPipe, UseGuards } from '@nestjs/common';
import { OrderService } from '../../application/services/order.service';
import { CreateOrderDto } from '../../application/dtos/create-order.dto';
import { UpdateOrderStatusDto } from '../../application/dtos/update-order-status.dto';
import { OrderFiltersDto } from '../../application/dtos/order-filters.dto';
import { CancelOrderDto } from '../../application/dtos/cancel-order.dto';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  /**
   * Create a new order
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createOrder(@Body(ValidationPipe) createOrderDto: CreateOrderDto) {
    const order = await this.orderService.createOrder(createOrderDto);
    return {
      success: true,
      message: 'Order created successfully',
      data: order,
    };
  }

  /**
   * Get order by ID
   */
  @Get(':id')
  async getOrder(@Param('id') id: string) {
    const order = await this.orderService.getOrderById(id);
    return {
      success: true,
      data: order,
    };
  }

  /**
   * Get order by order number
   */
  @Get('number/:orderNumber')
  async getOrderByNumber(@Param('orderNumber') orderNumber: string) {
    const order = await this.orderService.getOrderByNumber(orderNumber);
    return {
      success: true,
      data: order,
    };
  }

  /**
   * List orders for a user
   */
  @Get('user/:userId')
  async listUserOrders(@Param('userId') userId: string, @Query(ValidationPipe) filters: OrderFiltersDto) {
    const result = await this.orderService.listOrders(userId, filters);
    return {
      success: true,
      data: result.orders,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }

  /**
   * Update order status
   */
  @Put(':id/status')
  async updateOrderStatus(@Param('id') id: string, @Body(ValidationPipe) updateDto: UpdateOrderStatusDto) {
    const order = await this.orderService.updateOrderStatus(id, updateDto);
    return {
      success: true,
      message: 'Order status updated successfully',
      data: order,
    };
  }

  /**
   * Cancel order
   */
  @Delete(':id/cancel')
  async cancelOrder(@Param('id') id: string, @Body(ValidationPipe) cancelDto: CancelOrderDto) {
    const order = await this.orderService.cancelOrder(id, cancelDto);
    return {
      success: true,
      message: 'Order cancelled successfully',
      data: order,
    };
  }

  /**
   * Get order status history
   */
  @Get(':id/history')
  async getOrderHistory(@Param('id') id: string) {
    const history = await this.orderService.getOrderStatusHistory(id);
    return {
      success: true,
      data: history,
    };
  }

  /**
   * Get tracking information
   */
  @Get(':id/tracking')
  async getTrackingInfo(@Param('id') id: string) {
    const tracking = await this.orderService.getTrackingInfo(id);
    return {
      success: true,
      data: tracking,
    };
  }
}
