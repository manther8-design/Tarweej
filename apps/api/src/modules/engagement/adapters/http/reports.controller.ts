import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../identity/adapters/http/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../identity/adapters/http/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../../../identity/domain/identity.types';
import { ReportsService } from '../../application/reports.service';
import { CreateReportDto } from './dto/reports.dto';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Post()
  @ApiOperation({ summary: 'Report a listing and/or user' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateReportDto) {
    return this.reports.create(user.id, body);
  }
}
