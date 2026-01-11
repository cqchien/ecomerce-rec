import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { CartService } from '../../application/services/cart.service';
import { AddToCartDto, UpdateCartItemDto, RemoveFromCartDto, ApplyCouponDto } from '../dto/cart.dto';

/**
 * Cart Controller (Presentation Layer)
 * Handles HTTP requests for cart operations
 */
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  /**
   * Get cart by user ID
   */
  @Get(':userId')
  async getCart(@Param('userId') userId: string) {
    return this.cartService.getCart(userId);
  }

  /**
   * Add item to cart
   */
  @Post('add')
  async addToCart(@Body() dto: AddToCartDto) {
    return this.cartService.addToCart(dto);
  }

  /**
   * Update cart item quantity
   */
  @Put('update')
  async updateCartItem(@Body() dto: UpdateCartItemDto) {
    return this.cartService.updateCartItem(dto);
  }

  /**
   * Remove item from cart
   */
  @Delete('remove')
  @HttpCode(HttpStatus.OK)
  async removeFromCart(@Body() dto: RemoveFromCartDto) {
    return this.cartService.removeFromCart(dto);
  }

  /**
   * Clear all items from cart
   */
  @Delete(':userId/clear')
  @HttpCode(HttpStatus.NO_CONTENT)
  async clearCart(@Param('userId') userId: string) {
    await this.cartService.clearCart(userId);
  }

  /**
   * Apply coupon to cart
   */
  @Post('coupon/apply')
  async applyCoupon(@Body() dto: ApplyCouponDto) {
    return this.cartService.applyCoupon(dto);
  }

  /**
   * Remove coupon from cart
   */
  @Delete(':userId/coupon')
  async removeCoupon(@Param('userId') userId: string) {
    return this.cartService.removeCoupon(userId);
  }

  /**
   * Initiate checkout process
   */
  @Post(':userId/checkout')
  async initiateCheckout(@Param('userId') userId: string) {
    return this.cartService.initiateCheckout(userId);
  }
}
