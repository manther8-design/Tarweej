import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class ListUsersQueryDto {
  @ApiPropertyOptional({ description: 'Search email, display name, or phone' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  q?: string;

  @ApiPropertyOptional({ description: 'Filter by role code' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  roleCode?: string;

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

export class UpsertSettingDto {
  @ApiProperty({ example: 'listings.featured_home_count' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  key!: string;

  @ApiProperty({ example: { count: 7 } })
  @IsObject()
  valueJson!: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string | null;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isSecret?: boolean;
}

export class UpsertFeatureFlagDto {
  @ApiProperty({ example: 'identity.google_sign_in' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  key!: string;

  @ApiProperty()
  @IsBoolean()
  isEnabled!: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  rulesJson?: Record<string, unknown>;
}

export class AssignRoleDto {
  @ApiProperty({ example: 'moderator' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(64)
  roleCode!: string;
}
