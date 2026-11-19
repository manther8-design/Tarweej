import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app/app.module';
import { AppLogger } from './common/logging/app-logger.service';

async function bootstrap(): Promise<void> {
  // rawBody enables HMAC verification for payment webhooks (TRW-010).
  const app = await NestFactory.create(AppModule, { bufferLogs: true, rawBody: true });
  const config = app.get(ConfigService);
  const logger = app.get(AppLogger);
  app.useLogger(logger);

  app.use(helmet());
  app.enableShutdownHooks();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const apiPrefix = config.getOrThrow<string>('app.apiPrefix');
  const apiVersion = config.getOrThrow<string>('app.apiVersion');

  app.setGlobalPrefix(apiPrefix);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: apiVersion,
  });

  const origins = config.getOrThrow<string[]>('app.corsOrigins');
  app.enableCors({ origin: origins, credentials: true });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Tarweej Platform API')
    .setDescription('Public API contract for the Tarweej marketplace platform (`/api/v1`).')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  // OpenAPI UI for the versioned API surface
  SwaggerModule.setup(`${apiPrefix}/v${apiVersion}/docs`, app, document, {
    useGlobalPrefix: false,
  });

  const port = config.getOrThrow<number>('app.port');
  await app.listen(port, '0.0.0.0');

  const bootstrapLogger = new Logger('Bootstrap');
  bootstrapLogger.log(`Tarweej API listening on http://localhost:${port}`);
  bootstrapLogger.log(`API base: http://localhost:${port}/${apiPrefix}/v${apiVersion}`);
  bootstrapLogger.log(`Swagger: http://localhost:${port}/${apiPrefix}/v${apiVersion}/docs`);
}

void bootstrap();
