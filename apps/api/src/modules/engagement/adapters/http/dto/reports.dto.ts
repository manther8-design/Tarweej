import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  REPORT_ACTIONS,
  REPORT_CLASSIFICATIONS,
  REPORT_CLOSE_STATUSES,
  REPORT_REASON_CODES,
  REPORT_STATUSES,
} from '../../../domain/reports.types';

export class CreateReportDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  listingId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  targetUserId?: string;

  @ApiProperty({ enum: REPORT_REASON_CODES })
  @IsString()
  @IsIn([...REPORT_REASON_CODES])
  reasonCode!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class ListReportsQueryDto {
  @ApiPropertyOptional({ enum: REPORT_STATUSES })
  @IsOptional()
  @IsString()
  @IsIn([...REPORT_STATUSES])
  status?: string;

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
}

export class ClassifyReportDto {
  @ApiProperty({ enum: REPORT_CLASSIFICATIONS })
  @IsString()
  @IsIn([...REPORT_CLASSIFICATIONS])
  classification!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class ActOnReportDto {
  @ApiProperty({ enum: REPORT_ACTIONS })
  @IsString()
  @IsIn([...REPORT_ACTIONS])
  action!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

export class CloseReportDto {
  @ApiProperty({ enum: REPORT_CLOSE_STATUSES })
  @IsString()
  @IsIn([...REPORT_CLOSE_STATUSES])
  status!: string;

  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;
}
