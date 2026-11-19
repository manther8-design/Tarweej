import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { IdentityModule } from '../identity/identity.module';
import { AdminAuditController } from './adapters/http/admin-audit.controller';
import { AdminConfigurationController } from './adapters/http/admin-configuration.controller';
import { AdminRbacController } from './adapters/http/admin-rbac.controller';
import { PublicConfigurationController } from './adapters/http/public-configuration.controller';
import { AuditService } from './application/audit.service';
import { FeatureFlagsService } from './application/feature-flags.service';
import { RbacService } from './application/rbac.service';
import { SettingsService } from './application/settings.service';

@Module({
  imports: [PrismaModule, IdentityModule],
  controllers: [
    PublicConfigurationController,
    AdminConfigurationController,
    AdminRbacController,
    AdminAuditController,
  ],
  providers: [AuditService, SettingsService, FeatureFlagsService, RbacService],
  exports: [AuditService, SettingsService, FeatureFlagsService, RbacService],
})
export class ConfigurationModule {}
