import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { storageConfig } from '../../common/config/storage.config';
import { ObjectStorageModule } from '../../infrastructure/object-storage/object-storage.module';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { CatalogModule } from '../catalog/catalog.module';
import { ConfigurationModule } from '../configuration/configuration.module';
import { IdentityModule } from '../identity/identity.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdminListingsController } from './adapters/http/admin-listings.controller';
import { ListingsController } from './adapters/http/listings.controller';
import { MediaController } from './adapters/http/media.controller';
import { MyListingsController } from './adapters/http/my-listings.controller';
import { ListingsService } from './application/listings.service';

/**
 * Listings bounded context (TRW-007).
 * Public: `/api/v1/listings`
 * Owner: `/api/v1/my/listings`
 * Admin/moderation: `/api/v1/admin/listings`
 */
@Module({
  imports: [
    ConfigModule.forFeature(storageConfig),
    PrismaModule,
    IdentityModule,
    ConfigurationModule,
    CatalogModule,
    ObjectStorageModule,
    NotificationsModule,
  ],
  controllers: [MyListingsController, ListingsController, AdminListingsController, MediaController],
  providers: [ListingsService],
  exports: [ListingsService],
})
export class ListingsModule {}
