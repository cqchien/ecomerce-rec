import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { OrderGrpcClient } from '../grpc-clients/order-grpc.client';
import { Request } from 'express';

@Controller('orders')
@UseGuards() // JWT guard from global
export class OrderController {
  constructor(private readonly orderGrpcClient: OrderGrpcClient) {}

  /**
   * Create a new order
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createOrder(@Req() req: Request, @Body() body: any) {
    const userId = (req.user as any)?.sub || (req.user as any)?.userId || (req.user as any)?.id;

    const result = await this.orderGrpcClient.createOrder({
      user_id: userId,
      items: body.items || [],
      shipping_address: body.shippingAddress,
      billing_address: body.billingAddress || body.shippingAddress,
      payment_method: body.paymentMethod,
      total_amount: {
        amount: body.totalAmount || body.total,
        currency: body.currency || 'USD',
      },
    });

    return {
      success: true,
      message: 'Order created successfully',
      data: result.order,
    };
  }

  /**
   * List user orders
   */
  @Get()
  async listOrders(@Req() req: Request, @Query() query: any) {
    const userId = (req.user as any)?.sub || (req.user as any)?.userId || (req.user as any)?.id;

    const result = await this.orderGrpcClient.listOrders({
      user_id: userId,
      page: parseInt(query.page) || 1,
      page_size: parseInt(query.limit || query.pageSize) || 10,
      status: query.status,
    });

    return {
      success: true,
      data: result.orders || [],
      pagination: {
        page: result.page || 1,
        pageSize: result.page_size || 10,
        total: result.total || 0,
        totalPages: result.total_pages || 0,
      },
    };
  }

  /**
   * Get order details
   */
  @Get(':id')
  async getOrder(@Req() req: Request, @Param('id') orderId: string) {
    const userId = (req.user as any)?.sub || (req.user as any)?.userId || (req.user as any)?.id;
    const result = await this.orderGrpcClient.getOrder(orderId, userId);
    return {
      success: true,
      data: result.order,
    };
  }

  /**
   * Cancel order
   */
  @Post(':id/cancel')
  async cancelOrder(@Req() req: Request, @Param('id') orderId: string) {
    const userId = (req.user as any)?.sub || (req.user as any)?.userId || (req.user as any)?.id;
    const result = await this.orderGrpcClient.cancelOrder(orderId, userId);
    return {
      success: true,
      message: 'Order cancelled successfully',
      data: result.order,
    };
  }

  /**
   * Get order status
   */
  @Get(':id/status')
  async getOrderStatus(@Req() req: Request, @Param('id') orderId: string) {
    const userId = (req.user as any)?.sub || (req.user as any)?.userId || (req.user as any)?.id;
    const result = await this.orderGrpcClient.getOrderStatus(orderId, userId);
    return {
      success: true,
      data: {
        orderId: result.order_id,
        status: result.status,
        statusHistory: result.status_history || [],
        updatedAt: result.updated_at,
      },
    };
  }
}
