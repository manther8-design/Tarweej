import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { DEVICE_PLATFORMS } from '../../../domain/notifications.types';

export class ListNotificationsQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number;

  @ApiPropertyOptional({ description: 'When true, only unread notifications' })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  unreadOnly?: boolean;
}

export class RegisterDeviceTokenDto {
  @ApiProperty({ example: 'fcm-device-token-example' })
  @IsString()
  @MinLength(8)
  @MaxLength(512)
  token!: string;

  @ApiProperty({ enum: DEVICE_PLATFORMS })
  @IsString()
  @IsIn([...DEVICE_PLATFORMS])
  platform!: string;
}

export class UnregisterDeviceTokenDto {
  @ApiProperty()
  @IsString()
  @MinLength(8)
  @MaxLength(512)
  token!: string;
}
