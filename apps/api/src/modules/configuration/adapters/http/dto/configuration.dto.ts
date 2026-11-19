import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

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
