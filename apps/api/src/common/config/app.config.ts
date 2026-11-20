import { registerAs } from '@nestjs/config';
import { parseCorsOrigins } from '../http/cors-origin';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  apiPrefix: process.env.API_PREFIX ?? 'api',
  apiVersion: process.env.API_VERSION ?? '1',
  /** Exact origins from `CORS_ORIGINS`. Non-prod also allows localhost/127.0.0.1 any port. */
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGINS ?? 'http://localhost:3000'),
  logLevel: process.env.LOG_LEVEL ?? 'info',
  /** `json` (default in production) | `pretty` (default in non-prod) */
  logFormat: process.env.LOG_FORMAT ?? '',
  enableSwagger:
    (process.env.ENABLE_SWAGGER ?? '').toLowerCase() === 'true' ||
    (process.env.NODE_ENV ?? 'development') !== 'production',
  authRateLimitWindowSeconds: Number(process.env.AUTH_RATE_LIMIT_WINDOW_SECONDS ?? 60),
  authRateLimitMax: Number(process.env.AUTH_RATE_LIMIT_MAX ?? 30),
}));
