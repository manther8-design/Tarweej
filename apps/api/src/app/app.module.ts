import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig } from '../common/config/app.config';
import { identityConfig } from '../common/config/identity.config';
import { validateEnvironment } from '../common/config/environment.validation';
import { HealthModule } from '../common/health/health.module';
import { LoggingModule } from '../common/logging/logging.module';
import { PrismaModule } from '../infrastructure/prisma/prisma.module';
import { storageConfig } from '../common/config/storage.config';
import { CatalogModule } from '../modules/catalog/catalog.module';
import { CommercialModule } from '../modules/commercial/commercial.module';
import { ConfigurationModule } from '../modules/configuration/configuration.module';
import { EngagementModule } from '../modules/engagement/engagement.module';
import { IdentityModule } from '../modules/identity/identity.module';
import { ListingsModule } from '../modules/listings/listings.module';
import { ReferenceModule } from '../modules/reference/reference.module';
import { SearchModule } from '../modules/search/search.module';
import { RedisModule } from '../infrastructure/redis/redis.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [appConfig, identityConfig, storageConfig],
      validate: validateEnvironment,
    }),
    LoggingModule,
    PrismaModule,
    RedisModule,
    HealthModule,
    IdentityModule,
    ReferenceModule,
    ConfigurationModule,
    CatalogModule,
    ListingsModule,
    SearchModule,
    EngagementModule,
    CommercialModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
