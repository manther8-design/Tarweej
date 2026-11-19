import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../identity/adapters/http/decorators/current-user.decorator';
import { RequirePermissions } from '../../../identity/adapters/http/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../../identity/adapters/http/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../identity/adapters/http/guards/permissions.guard';
import type { AuthenticatedUser } from '../../../identity/domain/identity.types';
import { FeatureFlagsService } from '../../application/feature-flags.service';
import { SettingsService } from '../../application/settings.service';
import { UpsertFeatureFlagDto, UpsertSettingDto } from './dto/configuration.dto';

@ApiTags('admin-configuration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/configuration')
export class AdminConfigurationController {
  constructor(
    private readonly settings: SettingsService,
    private readonly flags: FeatureFlagsService,
  ) {}

  @Get('settings')
  @RequirePermissions('config.settings.read')
  @ApiOperation({ summary: 'Admin list all business settings (includes secrets)' })
  listSettings() {
    return this.settings.listAdmin();
  }

  @Put('settings')
  @RequirePermissions('config.settings.write')
  @ApiOperation({ summary: 'Create or update a business setting (audited)' })
  upsertSetting(@CurrentUser() user: AuthenticatedUser, @Body() body: UpsertSettingDto) {
    return this.settings.upsertAdmin(user.id, body);
  }

  @Get('feature-flags')
  @RequirePermissions('config.flags.read')
  @ApiOperation({ summary: 'Admin list feature flags' })
  listFlags() {
    return this.flags.listAdmin();
  }

  @Put('feature-flags')
  @RequirePermissions('config.flags.write')
  @ApiOperation({ summary: 'Create or update a feature flag (audited)' })
  upsertFlag(@CurrentUser() user: AuthenticatedUser, @Body() body: UpsertFeatureFlagDto) {
    return this.flags.upsertAdmin(user.id, body);
  }
}
