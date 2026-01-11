import { IsNotEmpty, IsEnum, IsNumber, IsString, IsOptional, Min } from 'class-validator';
import { RefundReason, PAYMENT_RULES } from '../../common/constants';

export class CreateRefundDto {
  @IsNotEmpty()
  @IsNumber()
  @Min(PAYMENT_RULES.MIN_AMOUNT)
  amount: number;

  @IsNotEmpty()
  @IsEnum(RefundReason)
  reason: RefundReason;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  requestedBy?: string;
}
