import { IsString, IsInt, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { MIN_QUANTITY, MAX_QUANTITY } from '../../common/constants';

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

export class RemoveFromCartDto {
  @IsString()
  userId: string;

  @IsString()
  cartItemId: string;
}

export class ApplyCouponDto {
  @IsString()
  userId: string;

  @IsString()
  couponCode: string;
}
