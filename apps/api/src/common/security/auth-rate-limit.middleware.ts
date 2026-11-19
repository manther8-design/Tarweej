import { HttpException, HttpStatus, Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NextFunction, Request, Response } from 'express';
import { RedisService } from '../../infrastructure/redis/redis.service';

const PROTECTED_SUFFIXES = [
  '/identity/auth/register',
  '/identity/auth/login',
  '/identity/auth/refresh',
  '/identity/auth/google',
  '/identity/otp/request',
  '/identity/otp/verify',
];

/**
 * Lightweight Redis-backed rate limit for identity auth / OTP surfaces.
 * Fails open (with a warning) if Redis is unavailable so local/dev without
 * Redis still works; production readiness requires Redis so this stays active.
 */
@Injectable()
export class AuthRateLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AuthRateLimitMiddleware.name);

  constructor(
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {}

  async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    const path = req.path || req.url || '';
    const protectedRoute = PROTECTED_SUFFIXES.some((suffix) => path.endsWith(suffix));
    if (!protectedRoute) {
      next();
      return;
    }

    const windowSeconds = Number(
      this.config.get<number>('app.authRateLimitWindowSeconds') ??
        process.env.AUTH_RATE_LIMIT_WINDOW_SECONDS ??
        60,
    );
    const max = Number(
      this.config.get<number>('app.authRateLimitMax') ?? process.env.AUTH_RATE_LIMIT_MAX ?? 30,
    );

    const client = this.redis.getClient();
    if (!client) {
      this.logger.debug('Auth rate limit skipped (Redis unavailable)');
      next();
      return;
    }

    const ip =
      (typeof req.headers['x-forwarded-for'] === 'string'
        ? req.headers['x-forwarded-for'].split(',')[0]?.trim()
        : undefined) ||
      req.ip ||
      req.socket.remoteAddress ||
      'unknown';
    const key = `rl:auth:${ip}:${path}`;

    try {
      const count = await client.incr(key);
      if (count === 1) {
        await client.expire(key, windowSeconds);
      }
      if (count > max) {
        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: 'Too many auth attempts; try again later',
            error: 'Too Many Requests',
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      this.logger.warn(
        `Auth rate limit Redis error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    next();
  }
}
