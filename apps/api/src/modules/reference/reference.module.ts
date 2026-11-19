import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { IdentityModule } from '../identity/identity.module';
import { AdminReferenceController } from './adapters/http/admin-reference.controller';
import { ReferenceController } from './adapters/http/reference.controller';
import { ReferenceService } from './application/reference.service';

/**
 * Reference data bounded context (TRW-004).
 * Public reads under `/api/v1/reference/...`; admin mutations under `/api/v1/admin/reference/...`.
 */
@Module({
  imports: [PrismaModule, IdentityModule],
  controllers: [ReferenceController, AdminReferenceController],
  providers: [ReferenceService],
  exports: [ReferenceService],
})
export class ReferenceModule {}
