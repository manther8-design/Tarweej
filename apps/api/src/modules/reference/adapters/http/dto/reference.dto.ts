import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class TranslationDto {
  @ApiProperty({ example: 'ar' })
  @IsString()
  @MinLength(2)
  @MaxLength(16)
  languageCode!: string;

  @ApiPropertyOptional({ example: 'name', default: 'name' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  fieldName?: string;

  @ApiProperty({ example: 'المملكة العربية السعودية' })
  @IsString()
  @MinLength(1)
  value!: string;
}

export class CreateCountryDto {
  @ApiProperty({ example: 'SA' })
  @IsString()
  @Length(2, 2)
  iso2!: string;

  @ApiProperty({ example: 'SAU' })
  @IsString()
  @Length(3, 3)
  iso3!: string;

  @ApiProperty({ example: '+966' })
  @IsString()
  @MinLength(2)
  @MaxLength(8)
  dialingCode!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [TranslationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TranslationDto)
  translations?: TranslationDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  primaryLanguageId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  primaryLocaleId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  primaryCurrencyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  primaryTimeZoneId?: string;
}

export class UpdateCountryDto {
  @ApiPropertyOptional({ example: 'SA' })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  iso2?: string;

  @ApiPropertyOptional({ example: 'SAU' })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  iso3?: string;

  @ApiPropertyOptional({ example: '+966' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(8)
  dialingCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [TranslationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TranslationDto)
  translations?: TranslationDto[];
}

export class CreateLanguageDto {
  @ApiProperty({ example: 'ar' })
  @IsString()
  @MinLength(2)
  @MaxLength(16)
  code!: string;

  @ApiProperty({ example: 'العربية' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isRtl?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateLanguageDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(16)
  code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isRtl?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateCurrencyDto {
  @ApiProperty({ example: 'SAR' })
  @IsString()
  @MinLength(3)
  @MaxLength(8)
  code!: string;

  @ApiProperty({ example: 'Saudi Riyal' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minorUnits?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCurrencyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(8)
  code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  minorUnits?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateLocaleDto {
  @ApiProperty({ example: 'ar-SA' })
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  code!: string;

  @ApiProperty()
  @IsUUID()
  languageId!: string;

  @ApiProperty({ example: 'Arabic (Saudi Arabia)' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateLocaleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(32)
  code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  languageId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateRegionDto {
  @ApiProperty()
  @IsUUID()
  countryId!: string;

  @ApiProperty({ example: 'RIY' })
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  code!: string;

  @ApiProperty({ example: 'Riyadh Region' })
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [TranslationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TranslationDto)
  translations?: TranslationDto[];
}

export class UpdateRegionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [TranslationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TranslationDto)
  translations?: TranslationDto[];
}

export class CreateCityDto {
  @ApiProperty()
  @IsUUID()
  regionId!: string;

  @ApiProperty({ example: 'Riyadh' })
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [TranslationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TranslationDto)
  translations?: TranslationDto[];
}

export class UpdateCityDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  name?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsNumber()
  latitude?: number | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsNumber()
  longitude?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  regionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [TranslationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TranslationDto)
  translations?: TranslationDto[];
}

export class SetAssociationDto {
  @ApiProperty({ enum: ['language', 'locale', 'currency', 'timeZone', 'dialingCode'] })
  @IsIn(['language', 'locale', 'currency', 'timeZone', 'dialingCode'])
  type!: 'language' | 'locale' | 'currency' | 'timeZone' | 'dialingCode';

  @ApiProperty({ description: 'Target entity id for the association' })
  @IsUUID()
  targetId!: string;

  @ApiProperty({ description: 'Whether this association is the primary for the country' })
  @IsBoolean()
  isPrimary!: boolean;
}
