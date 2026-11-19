import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FeatureFlagsService } from '../../application/feature-flags.service';
import { SettingsService } from '../../application/settings.service';

@ApiTags('configuration')
@Controller('configuration')
export class PublicConfigurationController {
  constructor(
    private readonly settings: SettingsService,
    private readonly flags: FeatureFlagsService,
  ) {}

  @Get('settings')
  @ApiOperation({ summary: 'Public non-secret business settings for clients' })
  listSettings() {
    return this.settings.listPublic();
  }

  @Get('settings/:key')
  @ApiOperation({ summary: 'Public non-secret setting by key' })
  getSetting(@Param('key') key: string) {
    return this.settings.getPublicByKey(key);
  }

  @Get('feature-flags')
  @ApiOperation({ summary: 'Public feature flag states for clients' })
  listFlags() {
    return this.flags.listPublic();
  }

  @Get('feature-flags/:key')
  @ApiOperation({ summary: 'Public feature flag by key' })
  getFlag(@Param('key') key: string) {
    return this.flags.getPublicByKey(key);
  }
}
