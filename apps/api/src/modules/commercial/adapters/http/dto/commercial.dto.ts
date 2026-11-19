import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class ListPlansQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  countryId?: string;
}

export class PurchasePromotionDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  listingId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  pricingRuleId!: string;

  @ApiPropertyOptional({ description: 'Hours of featured placement; defaults to plan default' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(720)
  durationHours?: number;

  @ApiProperty({ description: 'Client-generated idempotency key' })
  @IsString()
  @MinLength(8)
  @MaxLength(120)
  idempotencyKey!: string;
}

export class ListPaymentsQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;
}

export class MockCompletePaymentDto {
  @ApiPropertyOptional({ enum: ['paid', 'failed', 'cancelled'], default: 'paid' })
  @IsOptional()
  @IsIn(['paid', 'failed', 'cancelled'])
  outcome?: 'paid' | 'failed' | 'cancelled' = 'paid';
}

export class UpsertPricingRuleDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  id?: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  countryId!: string;

  @ApiProperty({ example: 'SAR' })
  @IsString()
  @MinLength(3)
  @MaxLength(3)
  @Transform(({ value }) => String(value).toUpperCase())
  currencyCode!: string;

  @ApiProperty({ example: 'home' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  placement!: string;

  @ApiProperty({ example: 2.5 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  pricePerHour!: number;

  @ApiProperty({ example: 7 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxSlots!: number;

  @ApiProperty({ example: 24 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  defaultDurationHours!: number;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minDurationHours?: number = 1;

  @ApiPropertyOptional({ example: 168, default: 168 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxDurationHours?: number = 168;

  @ApiPropertyOptional({ example: 100, default: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  rankWeight?: number = 100;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

export class UpsertPaymentRouteDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  countryId!: string;

  @ApiProperty({ example: 'mock' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  providerCode!: string;

  @ApiProperty({ example: 10, description: 'Lower number = higher priority' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  priority!: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
