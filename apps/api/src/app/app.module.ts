import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { appConfig } from '../common/config/app.config';
import { identityConfig } from '../common/config/identity.config';
import { validateEnvironment } from '../common/config/environment.validation';
import { HealthModule } from '../common/health/health.module';
import { CorrelationMiddleware } from '../common/logging/correlation.middleware';
import { HttpLoggingInterceptor } from '../common/logging/http-logging.interceptor';
import { LoggingModule } from '../common/logging/logging.module';
import { AuthRateLimitMiddleware } from '../common/security/auth-rate-limit.middleware';
import { PrismaModule } from '../infrastructure/prisma/prisma.module';
import { storageConfig } from '../common/config/storage.config';
import { CatalogModule } from '../modules/catalog/catalog.module';
import { CommercialModule } from '../modules/commercial/commercial.module';
import { ConfigurationModule } from '../modules/configuration/configuration.module';
import { EngagementModule } from '../modules/engagement/engagement.module';
import { IdentityController } from '../modules/identity/adapters/http/identity.controller';
import { IdentityModule } from '../modules/identity/identity.module';
import { ListingsModule } from '../modules/listings/listings.module';
import { NotificationsModule } from '../modules/notifications/notifications.module';
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
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpLoggingInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationMiddleware).forRoutes('*');
    consumer.apply(AuthRateLimitMiddleware).forRoutes(IdentityController);
  }
}
