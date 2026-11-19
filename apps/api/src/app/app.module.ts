import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig } from '../common/config/app.config';
import { identityConfig } from '../common/config/identity.config';
import { validateEnvironment } from '../common/config/environment.validation';
import { HealthModule } from '../common/health/health.module';
import { LoggingModule } from '../common/logging/logging.module';
import { PrismaModule } from '../infrastructure/prisma/prisma.module';
import { ConfigurationModule } from '../modules/configuration/configuration.module';
import { IdentityModule } from '../modules/identity/identity.module';
import { ReferenceModule } from '../modules/reference/reference.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [appConfig, identityConfig],
      validate: validateEnvironment,
    }),
    LoggingModule,
    PrismaModule,
    HealthModule,
    IdentityModule,
    ReferenceModule,
    ConfigurationModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
