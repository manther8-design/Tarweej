import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app/app.module';
import { createCorsOriginDelegate } from './common/http/cors-origin';
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
  const nodeEnv = config.getOrThrow<string>('app.nodeEnv');
  // Non-prod: localhost / 127.0.0.1 any port (Flutter Chrome). Prod: CORS_ORIGINS only.
  app.enableCors({
    origin: createCorsOriginDelegate({ nodeEnv, configuredOrigins: origins }),
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'x-correlation-id', 'x-request-id'],
  });

  const enableSwagger = config.get<boolean>('app.enableSwagger') ?? true;
  if (enableSwagger) {
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
  }

  const port = config.getOrThrow<number>('app.port');
  await app.listen(port, '0.0.0.0');

  const bootstrapLogger = new Logger('Bootstrap');
  bootstrapLogger.log(`Tarweej API listening on http://localhost:${port}`);
  bootstrapLogger.log(`API base: http://localhost:${port}/${apiPrefix}/v${apiVersion}`);
  if (enableSwagger) {
    bootstrapLogger.log(`Swagger: http://localhost:${port}/${apiPrefix}/v${apiVersion}/docs`);
  } else {
    bootstrapLogger.log('Swagger disabled (production default; set ENABLE_SWAGGER=true to enable)');
  }
}

void bootstrap();
