import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ATTRIBUTE_DATA_TYPES, LISTING_TYPES } from '../../../domain/catalog.types';

export class CreateCategoryDto {
  @ApiProperty({ example: 'electronics' })
  @IsString()
  @MaxLength(120)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase kebab-case',
  })
  slug!: string;

  @ApiProperty({ example: 'Electronics' })
  @IsString()
  @MaxLength(160)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @ApiPropertyOptional({ enum: LISTING_TYPES, default: 'marketplace' })
  @IsOptional()
  @IsIn([...LISTING_TYPES])
  listingType?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Optional translations: { ar: "إلكترونيات", en: "Electronics" }',
  })
  @IsOptional()
  @IsObject()
  translations?: Record<string, string>;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}

export class CreateAttributeDefinitionDto {
  @ApiProperty({ example: 'brand' })
  @IsString()
  @MaxLength(80)
  @Matches(/^[a-z0-9]+(?:_[a-z0-9]+)*$/, {
    message: 'code must be lowercase snake_case',
  })
  code!: string;

  @ApiProperty({ example: 'Brand' })
  @IsString()
  @MaxLength(160)
  name!: string;

  @ApiProperty({ enum: ATTRIBUTE_DATA_TYPES })
  @IsIn([...ATTRIBUTE_DATA_TYPES])
  dataType!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(40)
  unit?: string | null;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  validationJson?: Record<string, unknown> | null;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Optional translations: { ar: "العلامة", en: "Brand" }',
  })
  @IsOptional()
  @IsObject()
  translations?: Record<string, string>;
}

export class UpdateAttributeDefinitionDto extends PartialType(CreateAttributeDefinitionDto) {}

export class CreateAttributeOptionDto {
  @ApiProperty({ example: 'apple' })
  @IsString()
  @MaxLength(120)
  value!: string;

  @ApiProperty({ example: 'Apple' })
  @IsString()
  @MaxLength(160)
  label!: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  translations?: Record<string, string>;
}

export class UpdateAttributeOptionDto extends PartialType(CreateAttributeOptionDto) {}

export class AttachCategoryAttributeDto {
  @ApiProperty()
  @IsUUID()
  attributeDefinitionId!: string;

  @ApiPropertyOptional({
    description: 'Override required flag for this category; omit to inherit definition default',
  })
  @IsOptional()
  @IsBoolean()
  isRequiredOverride?: boolean | null;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCategoryAttributeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isRequiredOverride?: boolean | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpsertTranslationsDto {
  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'string' },
    example: { ar: 'هواتف', en: 'Phones' },
  })
  @IsObject()
  translations!: Record<string, string>;

  @ApiPropertyOptional({ default: 'name' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  fieldName?: string;
}

/** Nested option payload for seed-style admin create of attribute + options. */
export class AttributeOptionInlineDto {
  @ApiProperty()
  @IsString()
  @MaxLength(120)
  value!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(160)
  label!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class CreateAttributeWithOptionsDto extends CreateAttributeDefinitionDto {
  @ApiPropertyOptional({ type: [AttributeOptionInlineDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttributeOptionInlineDto)
  options?: AttributeOptionInlineDto[];
}
