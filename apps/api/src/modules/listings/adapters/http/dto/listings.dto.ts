import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { LISTING_TYPES } from '../../../../catalog/domain/catalog.types';

export class ListingAttributeInputDto {
  @ApiProperty()
  @IsUUID()
  attributeDefinitionId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  valueText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  valueNumber?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  valueBool?: boolean;

  @ApiPropertyOptional({ description: 'ISO date YYYY-MM-DD' })
  @IsOptional()
  @IsString()
  valueDate?: string;

  @ApiPropertyOptional({ description: 'JSON for multi_select / numeric_range' })
  @IsOptional()
  valueJson?: unknown;
}

export class CreateListingDto {
  @ApiProperty()
  @IsUUID()
  categoryId!: string;

  @ApiProperty()
  @IsUUID()
  countryId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  cityId?: string | null;

  @ApiPropertyOptional({ enum: LISTING_TYPES })
  @IsOptional()
  @IsIn([...LISTING_TYPES])
  listingType?: string;

  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  @MaxLength(10000)
  description!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  priceAmount?: number | null;

  @ApiPropertyOptional({ example: 'SAR' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currencyCode?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  latitude?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  longitude?: number | null;

  @ApiPropertyOptional({ type: [ListingAttributeInputDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ListingAttributeInputDto)
  attributes?: ListingAttributeInputDto[];

  @ApiPropertyOptional({
    description: 'When true, submit for review after create (requires attributes+media policy)',
  })
  @IsOptional()
  @IsBoolean()
  submitForReview?: boolean;
}

export class UpdateListingDto extends PartialType(CreateListingDto) {}

export class ModerateListingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class RecordViewDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  fingerprint?: string;
}

export class ListMyListingsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  pageSize?: number;
}

export class ListPublicListingsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  countryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  listingType?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  pageSize?: number;
}
