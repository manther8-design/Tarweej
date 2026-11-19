import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { SEARCH_SORT_OPTIONS } from '../../../domain/search.types';

function parseBool(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  const s = String(value).toLowerCase();
  if (s === 'true' || s === '1') return true;
  if (s === 'false' || s === '0') return false;
  return undefined;
}

export class SearchListingsQueryDto {
  @ApiPropertyOptional({ description: 'Free-text query over title and description' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  cityId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  countryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({
    description: 'Listing status filter (public API forces active)',
    default: 'active',
  })
  @IsOptional()
  @IsString()
  @IsIn(['active'])
  status?: string;

  @ApiPropertyOptional({ description: 'Filter to featured listings when true' })
  @IsOptional()
  @Transform(({ value }) => parseBool(value))
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({ enum: SEARCH_SORT_OPTIONS, default: 'newest' })
  @IsOptional()
  @IsIn([...SEARCH_SORT_OPTIONS])
  sort?: (typeof SEARCH_SORT_OPTIONS)[number];

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

  @ApiPropertyOptional({
    description:
      'JSON array of attribute filters: [{"attributeDefinitionId":"<uuid>","eq":"xiaomi"},{"attributeDefinitionId":"<uuid>","min":64,"max":256},{"attributeDefinitionId":"<uuid>","bool":true}]',
  })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  attrs?: string;
}
