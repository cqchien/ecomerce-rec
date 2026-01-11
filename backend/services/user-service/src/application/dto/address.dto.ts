import { IsString, IsBoolean, IsOptional, MinLength, MaxLength } from 'class-validator';
import {
  MIN_NAME_LENGTH,
  MAX_NAME_LENGTH,
  MAX_PHONE_LENGTH,
  MAX_ADDRESS_LINE_LENGTH,
  MAX_CITY_LENGTH,
  MAX_STATE_LENGTH,
  MAX_POSTAL_CODE_LENGTH,
  MAX_COUNTRY_LENGTH,
} from '../common/constants';

export class AddAddressDto {
  @IsString()
  userId: string;

  @IsString()
  @MinLength(MIN_NAME_LENGTH)
  @MaxLength(MAX_NAME_LENGTH)
  firstName: string;

  @IsString()
  @MinLength(MIN_NAME_LENGTH)
  @MaxLength(MAX_NAME_LENGTH)
  lastName: string;

  @IsString()
  @MaxLength(MAX_ADDRESS_LINE_LENGTH)
  addressLine1: string;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_ADDRESS_LINE_LENGTH)
  addressLine2?: string;

  @IsString()
  @MaxLength(MAX_CITY_LENGTH)
  city: string;

  @IsString()
  @MaxLength(MAX_STATE_LENGTH)
  state: string;

  @IsString()
  @MaxLength(MAX_POSTAL_CODE_LENGTH)
  postalCode: string;

  @IsString()
  @MaxLength(MAX_COUNTRY_LENGTH)
  country: string;

  @IsString()
  @MaxLength(MAX_PHONE_LENGTH)
  phone: string;

  @IsBoolean()
  isDefault: boolean;
}

export class UpdateAddressDto {
  @IsString()
  userId: string;

  @IsString()
  addressId: string;

  @IsOptional()
  @IsString()
  @MinLength(MIN_NAME_LENGTH)
  @MaxLength(MAX_NAME_LENGTH)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(MIN_NAME_LENGTH)
  @MaxLength(MAX_NAME_LENGTH)
  lastName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_ADDRESS_LINE_LENGTH)
  addressLine1?: string;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_ADDRESS_LINE_LENGTH)
  addressLine2?: string;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_CITY_LENGTH)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_STATE_LENGTH)
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_POSTAL_CODE_LENGTH)
  postalCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_COUNTRY_LENGTH)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_PHONE_LENGTH)
  phone?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
