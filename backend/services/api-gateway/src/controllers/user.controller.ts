import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { UserGrpcClient } from '../grpc-clients/user-grpc.client';
import { Request } from 'express';

@Controller('users')
@UseGuards() // JWT guard will be applied from global guard
export class UserController {
  constructor(private readonly userGrpcClient: UserGrpcClient) {}

  /**
   * Get user profile
   */
  @Get('profile')
  async getProfile(@Req() req: Request) {
    const userId = (req.user as any)?.sub || (req.user as any)?.userId || (req.user as any)?.id;
    const result = await this.userGrpcClient.getProfile(userId);
    return {
      success: true,
      data: result.profile,
    };
  }

  /**
   * Update user profile
   */
  @Put('profile')
  async updateProfile(@Req() req: Request, @Body() body: any) {
    const userId = (req.user as any)?.sub || (req.user as any)?.userId || (req.user as any)?.id;
    const result = await this.userGrpcClient.updateProfile({
      user_id: userId,
      name: body.name,
      phone: body.phone,
      avatar: body.avatar,
    });
    return {
      success: true,
      message: 'Profile updated successfully',
      data: result.profile,
    };
  }

  /**
   * List user addresses
   */
  @Get('addresses')
  async listAddresses(@Req() req: Request) {
    const userId = (req.user as any)?.sub || (req.user as any)?.userId || (req.user as any)?.id;
    const result = await this.userGrpcClient.listAddresses(userId);
    return {
      success: true,
      data: result.addresses || [],
    };
  }

  /**
   * Add address
   */
  @Post('addresses')
  @HttpCode(HttpStatus.CREATED)
  async addAddress(@Req() req: Request, @Body() body: any) {
    const userId = (req.user as any)?.sub || (req.user as any)?.userId || (req.user as any)?.id;
    const result = await this.userGrpcClient.addAddress({
      user_id: userId,
      ...body,
    });
    return {
      success: true,
      message: 'Address added successfully',
      data: result.address,
    };
  }

  /**
   * Update address
   */
  @Put('addresses/:id')
  async updateAddress(
    @Req() req: Request,
    @Param('id') addressId: string,
    @Body() body: any,
  ) {
    const userId = (req.user as any)?.userId || (req.user as any)?.id;
    const result = await this.userGrpcClient.updateAddress({
      user_id: userId,
      address_id: addressId,
      ...body,
    });
    return {
      success: true,
      message: 'Address updated successfully',
      data: result.address,
    };
  }

  /**
   * Delete address
   */
  @Delete('addresses/:id')
  async deleteAddress(@Req() req: Request, @Param('id') addressId: string) {
    const userId = (req.user as any)?.userId || (req.user as any)?.id;
    await this.userGrpcClient.deleteAddress(addressId, userId);
    return {
      success: true,
      message: 'Address deleted successfully',
    };
  }

  /**
   * Get user preferences
   */
  @Get('preferences')
  async getPreferences(@Req() req: Request) {
    const userId = (req.user as any)?.userId || (req.user as any)?.id;
    const result = await this.userGrpcClient.getPreferences(userId);
    return {
      success: true,
      data: result.preferences,
    };
  }

  /**
   * Update preferences
   */
  @Put('preferences')
  async updatePreferences(@Req() req: Request, @Body() body: any) {
    const userId = (req.user as any)?.userId || (req.user as any)?.id;
    const result = await this.userGrpcClient.updatePreferences({
      user_id: userId,
      ...body,
    });
    return {
      success: true,
      message: 'Preferences updated successfully',
      data: result.preferences,
    };
  }

  /**
   * Get wishlist
   */
  @Get('wishlist')
  async getWishlist(@Req() req: Request) {
    const userId = (req.user as any)?.userId || (req.user as any)?.id;
    const result = await this.userGrpcClient.getWishlist(userId);
    return {
      success: true,
      data: result.items || [],
      total: result.total || 0,
      page: result.page || 1,
      pageSize: result.page_size || 10,
      totalPages: result.total_pages || 0,
    };
  }

  /**
   * Add to wishlist
   */
  @Post('wishlist')
  @HttpCode(HttpStatus.CREATED)
  async addToWishlist(@Req() req: Request, @Body() body: { productId: string }) {
    const userId = (req.user as any)?.userId || (req.user as any)?.id;
    const result = await this.userGrpcClient.addToWishlist(userId, body.productId);
    return {
      success: true,
      message: 'Product added to wishlist',
      data: result.item,
    };
  }

  /**
   * Remove from wishlist
   */
  @Delete('wishlist/:productId')
  async removeFromWishlist(
    @Req() req: Request,
    @Param('productId') productId: string,
  ) {
    const userId = (req.user as any)?.userId || (req.user as any)?.id;
    await this.userGrpcClient.removeFromWishlist(userId, productId);
    return {
      success: true,
      message: 'Product removed from wishlist',
    };
  }
}
