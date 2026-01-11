import { IsNotEmpty, IsUUID, IsNumber, IsEnum, IsString, IsOptional, Min, IsEmail, IsObject } from 'class-validator';
import { PaymentMethod, Currency, PAYMENT_RULES } from '../../common/constants';

export class CreatePaymentDto {
  @IsNotEmpty()
  @IsUUID()
  orderId: string;

  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(PAYMENT_RULES.MIN_AMOUNT)
  amount: number;

  @IsNotEmpty()
  @IsEnum(Currency)
  currency: Currency;

  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  paymentMethodId?: string; // Stripe payment method ID

  @IsOptional()
  @IsEmail()
  receiptEmail?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
