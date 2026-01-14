import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { CartGrpcClient } from '../grpc-clients/cart-grpc.client';
import { Request } from 'express';

@Controller('cart')
@UseGuards() // JWT guard from global
export class CartController {
  constructor(private readonly cartGrpcClient: CartGrpcClient) {}

  /**
   * Get user's cart
   */
  @Get()
  async getCart(@Req() req: Request) {
    const userId = (req.user as any)?.sub || (req.user as any)?.userId || (req.user as any)?.id;
    const result = await this.cartGrpcClient.getCart(userId);
    return {
      success: true,
      data: result.cart,
    };
  }

  /**
   * Add item to cart
   */
  @Post('items')
  @HttpCode(HttpStatus.CREATED)
  async addToCart(@Req() req: Request, @Body() body: any) {
    const userId = (req.user as any)?.sub || (req.user as any)?.userId || (req.user as any)?.id;
    
    const result = await this.cartGrpcClient.addToCart({
      user_id: userId,
      product_id: body.productId,
      variant_id: body.variantId,
      name: body.name,
      image: body.image,
      sku: body.sku,
      quantity: body.quantity,
      unit_price: {
        amount: body.unitPrice || body.price,
        currency: body.currency || 'USD',
      },
    });

    return {
      success: true,
      message: 'Item added to cart',
      data: result.cart,
    };
  }

  /**
   * Update item quantity
   */
  @Put('items/:itemId')
  async updateCartItem(
    @Req() req: Request,
    @Param('itemId') itemId: string,
    @Body() body: { quantity: number },
  ) {
    const userId = (req.user as any)?.userId || (req.user as any)?.id;
    
    const result = await this.cartGrpcClient.updateItemQuantity({
      user_id: userId,
      item_id: itemId,
      quantity: body.quantity,
    });

    return {
      success: true,
      message: 'Cart item updated',
      data: result.cart,
    };
  }

  /**
   * Remove item from cart
   */
  @Delete('items/:itemId')
  async removeFromCart(@Req() req: Request, @Param('itemId') itemId: string) {
    const userId = (req.user as any)?.userId || (req.user as any)?.id;
    await this.cartGrpcClient.removeItem(userId, itemId);
    return {
      success: true,
      message: 'Item removed from cart',
    };
  }

  /**
   * Clear entire cart
   */
  @Delete('clear')
  async clearCart(@Req() req: Request) {
    const userId = (req.user as any)?.sub || (req.user as any)?.userId || (req.user as any)?.id;
    await this.cartGrpcClient.clearCart(userId);
    return {
      success: true,
      message: 'Cart cleared',
    };
  }

  /**
   * Apply coupon code
   */
  @Post('coupon')
  async applyCoupon(@Req() req: Request, @Body() body: { couponCode: string }) {
    const userId = (req.user as any)?.sub || (req.user as any)?.userId || (req.user as any)?.id;
    const result = await this.cartGrpcClient.applyCoupon(userId, body.couponCode);
    return {
      success: true,
      message: 'Coupon applied successfully',
      data: result.cart,
    };
  }

  /**
   * Remove coupon
   */
  @Delete('coupon')
  async removeCoupon(@Req() req: Request) {
    const userId = (req.user as any)?.userId || (req.user as any)?.id;
    const result = await this.cartGrpcClient.removeCoupon(userId);
    return {
      success: true,
      message: 'Coupon removed',
      data: result.cart,
    };
  }
}
