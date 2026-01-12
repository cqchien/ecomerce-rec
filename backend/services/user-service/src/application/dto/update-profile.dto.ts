import { IsString, IsEmail, IsOptional, MinLength, MaxLength } from 'class-validator';
import { MIN_NAME_LENGTH, MAX_NAME_LENGTH, MAX_PHONE_LENGTH } from '../../common/constants';

export class UpdateProfileDto {
  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  @MinLength(MIN_NAME_LENGTH)
  @MaxLength(MAX_NAME_LENGTH)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(MAX_PHONE_LENGTH)
  phone?: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}
