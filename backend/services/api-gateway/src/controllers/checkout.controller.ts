import {
  Controller,
  Post,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';
import { CartGrpcClient } from '../grpc-clients/cart-grpc.client';
import { OrderGrpcClient } from '../grpc-clients/order-grpc.client';
import { PaymentGrpcClient } from '../grpc-clients/payment-grpc.client';
import { UserGrpcClient } from '../grpc-clients/user-grpc.client';

@Controller('checkout')
@UseGuards() // JWT guard from global
export class CheckoutController {
  constructor(
    private readonly cartGrpcClient: CartGrpcClient,
    private readonly orderGrpcClient: OrderGrpcClient,
    private readonly paymentGrpcClient: PaymentGrpcClient,
    private readonly userGrpcClient: UserGrpcClient,
  ) {}

  /**
   * Calculate checkout totals
   * Returns cart with applied discounts, shipping, taxes
   */
  @Post('calculate')
  async calculateCheckout(@Req() req: Request, @Body() body: any) {
    const userId = (req.user as any)?.sub || (req.user as any)?.userId || (req.user as any)?.id;

    // Get current cart
    const cartResult = await this.cartGrpcClient.getCart(userId);
    const cart = cartResult.cart;

    if (!cart || !cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // If address is provided, we could calculate shipping (simplified for now)
    const shippingCost = body.shippingAddressId ? 10.0 : 0; // Flat rate or free
    const tax = (cart.subtotal.amount * 0.1); // 10% tax (simplified)

    const total = cart.subtotal.amount - (cart.discount?.amount || 0) + shippingCost + tax;

    return {
      success: true,
      data: {
        items: cart.items,
        subtotal: cart.subtotal,
        discount: cart.discount,
        shipping: {
          amount: shippingCost,
          currency: cart.subtotal.currency,
        },
        tax: {
          amount: tax,
          currency: cart.subtotal.currency,
        },
        total: {
          amount: total,
          currency: cart.subtotal.currency,
        },
        couponCode: cart.coupon_code,
      },
    };
  }

  /**
   * Create payment intent
   * Prepares the payment without confirming it
   */
  @Post('payment-intent')
  async createPaymentIntent(@Req() req: Request, @Body() body: any) {
    const userId = (req.user as any)?.sub || (req.user as any)?.userId || (req.user as any)?.id;

    if (!body.amount || !body.currency) {
      throw new BadRequestException('Amount and currency are required');
    }

    // Create payment intent (doesn't charge yet)
    const result = await this.paymentGrpcClient.createPaymentIntent({
      user_id: userId,
      order_id: body.orderId || 'temp_' + Date.now(), // Temporary ID if order not created yet
      amount: {
        amount: body.amount,
        currency: body.currency || 'USD',
      },
      payment_method: body.paymentMethod || 'credit_card',
    });

    return {
      success: true,
      message: 'Payment intent created',
      data: {
        paymentIntentId: result.payment_id,
        clientSecret: result.client_secret,
        amount: result.amount,
        status: result.status,
      },
    };
  }

  /**
   * Confirm checkout
   * Complete end-to-end checkout flow:
   * 1. Get cart
   * 2. Create order
   * 3. Process payment
   * 4. Clear cart
   */
  @Post('confirm')
  async confirmCheckout(@Req() req: Request, @Body() body: any) {
    const userId = (req.user as any)?.sub || (req.user as any)?.userId || (req.user as any)?.id;

    try {
      // Step 1: Get cart to create order
      const cartResult = await this.cartGrpcClient.getCart(userId);
      const cart = cartResult.cart;

      if (!cart || !cart.items || cart.items.length === 0) {
        throw new BadRequestException('Cart is empty');
      }

      // Step 2: Validate shipping address
      // For now, we accept either a shipping address object or an ID
      // (User service gRPC is disabled, so we can't look up by ID)
      if (!body.shippingAddress && !body.shippingAddressId) {
        throw new BadRequestException('Shipping address or address ID is required');
      }

      // Step 3: Calculate total
      const shippingCost = 10.0; // Simplified
      const tax = cart.subtotal.amount * 0.1;
      const totalAmount = cart.subtotal.amount - (cart.discount?.amount || 0) + shippingCost + tax;

      // Step 4: Create order
      const orderResult = await this.orderGrpcClient.createOrder({
        user_id: userId,
        items: cart.items,
        shipping_address_id: body.shippingAddressId || 'guest_shipping',
        billing_address_id: body.billingAddressId || body.shippingAddressId || 'guest_billing',
        payment_method: body.paymentMethod || 'credit_card',
        total_amount: {
          amount: totalAmount,
          currency: cart.subtotal.currency || 'USD',
        },
      });

      const order = orderResult.order;

      // Step 5: Create and confirm payment
      const paymentIntentResult = await this.paymentGrpcClient.createPaymentIntent({
        user_id: userId,
        order_id: order.id,
        amount: {
          amount: totalAmount,
          currency: cart.subtotal.currency || 'USD',
        },
        payment_method: body.paymentMethod || 'credit_card',
      });

      // Confirm the payment (in real scenario, this would be done after payment provider confirmation)
      const paymentResult = await this.paymentGrpcClient.confirmPayment({
        payment_id: paymentIntentResult.payment_id,
        payment_method: body.paymentMethod || 'credit_card',
        metadata: {
          order_id: order.id,
          user_id: userId,
        },
      });

      // Step 6: Clear cart after successful order and payment
      await this.cartGrpcClient.clearCart(userId);

      return {
        success: true,
        message: 'Checkout completed successfully',
        data: {
          order: order,
          payment: {
            id: paymentResult.payment_id,
            status: paymentResult.status,
            amount: paymentResult.amount,
          },
        },
      };
    } catch (error) {
      throw new BadRequestException(
        `Checkout failed: ${error.message || 'Unknown error'}`,
      );
    }
  }
}
