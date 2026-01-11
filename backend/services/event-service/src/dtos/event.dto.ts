import { IsNotEmpty, IsString, IsOptional, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { EventPriority } from '../common/constants';

export class PublishEventDto {
  @IsNotEmpty()
  @IsString()
  topic: string;

  @IsNotEmpty()
  data: any;

  @IsOptional()
  @IsEnum(EventPriority)
  priority?: EventPriority;

  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  correlationId?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  key?: string;
}

export class BatchEventDto {
  @IsNotEmpty()
  data: any;

  @IsOptional()
  @IsString()
  key?: string;
}

export class PublishBatchDto {
  @IsNotEmpty()
  @IsString()
  topic: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchEventDto)
  events: BatchEventDto[];
}
