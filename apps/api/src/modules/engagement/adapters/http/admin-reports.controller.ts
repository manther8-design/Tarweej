import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../identity/adapters/http/decorators/current-user.decorator';
import { RequirePermissions } from '../../../identity/adapters/http/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../../identity/adapters/http/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../identity/adapters/http/guards/permissions.guard';
import type { AuthenticatedUser } from '../../../identity/domain/identity.types';
import { ReportsService } from '../../application/reports.service';
import {
  ActOnReportDto,
  ClassifyReportDto,
  CloseReportDto,
  ListReportsQueryDto,
} from './dto/reports.dto';

@ApiTags('admin-reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/reports')
export class AdminReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get()
  @RequirePermissions('reports.read')
  @ApiOperation({ summary: 'Moderation queue (open/in_review by default)' })
  list(@Query() query: ListReportsQueryDto) {
    return this.reports.listAdmin(query);
  }

  @Get(':id')
  @RequirePermissions('reports.read')
  @ApiOperation({ summary: 'Get report detail' })
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.reports.getAdmin(id);
  }

  @Post(':id/classify')
  @RequirePermissions('reports.moderate')
  @ApiOperation({ summary: 'Classify a report and move to in_review' })
  classify(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: ClassifyReportDto,
  ) {
    return this.reports.classify(user.id, id, body);
  }

  @Post(':id/act')
  @RequirePermissions('reports.moderate')
  @ApiOperation({ summary: 'Apply a moderation action (e.g. hide listing)' })
  act(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: ActOnReportDto,
  ) {
    return this.reports.act(user.id, id, body);
  }

  @Post(':id/close')
  @RequirePermissions('reports.moderate')
  @ApiOperation({ summary: 'Close report as resolved or dismissed with reason' })
  close(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CloseReportDto,
  ) {
    return this.reports.close(user.id, id, body);
  }
}
