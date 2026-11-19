import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { ConfigurationModule } from '../configuration/configuration.module';
import { IdentityModule } from '../identity/identity.module';
import { AdminCategoriesController } from './adapters/http/admin-categories.controller';
import { CategoriesController } from './adapters/http/categories.controller';
import { CatalogService } from './application/catalog.service';

/**
 * Catalog bounded context (TRW-006).
 * Public reads under `/api/v1/categories`; admin under `/api/v1/admin/categories`.
 */
@Module({
  imports: [PrismaModule, IdentityModule, ConfigurationModule],
  controllers: [CategoriesController, AdminCategoriesController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
