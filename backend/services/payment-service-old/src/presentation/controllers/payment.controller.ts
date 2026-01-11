import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpStatus, HttpCode, ValidationPipe, Headers, RawBodyRequest, Req } from '@nestjs/common';
import { Request } from 'express';
import { PaymentService } from '../../application/services/payment.service';
import { CreatePaymentDto } from '../../application/dtos/create-payment.dto';
import { CreateRefundDto } from '../../application/dtos/create-refund.dto';
import { ConfirmPaymentDto } from '../../application/dtos/confirm-payment.dto';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * Create payment intent
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPayment(@Body(ValidationPipe) createPaymentDto: CreatePaymentDto) {
    const payment = await this.paymentService.createPayment(createPaymentDto);
    return {
      success: true,
      message: 'Payment intent created successfully',
      data: {
        paymentId: payment.id,
        paymentIntentId: payment.paymentIntentId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
      },
    };
  }

  /**
   * Confirm payment
   */
  @Post(':id/confirm')
  async confirmPayment(@Param('id') id: string, @Body(ValidationPipe) confirmDto: ConfirmPaymentDto) {
    const payment = await this.paymentService.confirmPayment(id, confirmDto);
    return {
      success: true,
      message: 'Payment confirmed successfully',
      data: payment,
    };
  }

  /**
   * Get payment by ID
   */
  @Get(':id')
  async getPayment(@Param('id') id: string) {
    const payment = await this.paymentService.getPaymentById(id);
    return {
      success: true,
      data: payment,
    };
  }

  /**
   * Get payment by order ID
   */
  @Get('order/:orderId')
  async getPaymentByOrder(@Param('orderId') orderId: string) {
    const payment = await this.paymentService.getPaymentByOrderId(orderId);
    return {
      success: true,
      data: payment,
    };
  }

  /**
   * List user payments
   */
  @Get('user/:userId')
  async listUserPayments(
    @Param('userId') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    const result = await this.paymentService.listUserPayments(userId, page, limit);
    return {
      success: true,
      data: result.payments,
      meta: {
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit),
      },
    };
  }

  /**
   * Create refund
   */
  @Post(':id/refund')
  @HttpCode(HttpStatus.CREATED)
  async createRefund(@Param('id') id: string, @Body(ValidationPipe) createRefundDto: CreateRefundDto) {
    const refund = await this.paymentService.createRefund(id, createRefundDto);
    return {
      success: true,
      message: 'Refund initiated successfully',
      data: refund,
    };
  }

  /**
   * Cancel payment
   */
  @Delete(':id/cancel')
  async cancelPayment(@Param('id') id: string) {
    const payment = await this.paymentService.cancelPayment(id);
    return {
      success: true,
      message: 'Payment cancelled successfully',
      data: payment,
    };
  }

  /**
   * Stripe webhook handler
   */
  @Post('webhook/stripe')
  async handleStripeWebhook(@Headers('stripe-signature') signature: string, @Req() req: RawBodyRequest<Request>) {
    // Note: In production, verify webhook signature
    // const event = stripe.webhooks.constructEvent(req.rawBody, signature, webhookSecret);
    
    const event = req.body;
    await this.paymentService.handleStripeWebhook(event);
    
    return { received: true };
  }
}
