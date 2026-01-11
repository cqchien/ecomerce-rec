import { IsString, IsInt, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { MIN_QUANTITY, MAX_QUANTITY } from '../../../common/constants';

/**
 * DTO for adding item to cart
 */
export class AddToCartDto {
  @IsString()
  userId: string;

  @IsString()
  productId: string;

  @IsOptional()
  @IsString()
  variantId?: string;

  @IsInt()
  @Min(MIN_QUANTITY)
  @Max(MAX_QUANTITY)
  quantity: number;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsNumber()
  unitPrice: number;
}

/**
 * DTO for updating cart item quantity
 */
export class UpdateCartItemDto {
  @IsString()
  userId: string;

  @IsString()
  cartItemId: string;

  @IsInt()
  @Min(MIN_QUANTITY)
  @Max(MAX_QUANTITY)
  quantity: number;
}

/**
 * DTO for removing item from cart
 */
export class RemoveFromCartDto {
  @IsString()
  userId: string;

  @IsString()
  cartItemId: string;
}

/**
 * DTO for applying coupon to cart
 */
export class ApplyCouponDto {
  @IsString()
  userId: string;

  @IsString()
  couponCode: string;
}
