import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { CancellationReason } from '../../common/constants';

export class CancelOrderDto {
  @IsNotEmpty()
  @IsEnum(CancellationReason)
  reason: CancellationReason;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  cancelledBy?: string;
}
