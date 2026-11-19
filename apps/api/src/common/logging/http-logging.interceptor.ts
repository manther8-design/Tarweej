import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';
import { AppLogger } from './app-logger.service';

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: AppLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const started = Date.now();
    const path = req.originalUrl ?? req.url;

    // Health/metrics probes stay quiet to avoid log noise under load balancers.
    const quiet = path.includes('/health/') || path.includes('/metrics');

    if (!quiet) {
      this.logger.log(`${req.method} ${path} start`);
    }

    return next.handle().pipe(
      tap({
        next: () => {
          if (quiet) return;
          this.logger.log(`${req.method} ${path} ${res.statusCode} ${Date.now() - started}ms`);
        },
        error: (err: unknown) => {
          const status =
            typeof err === 'object' &&
            err !== null &&
            'status' in err &&
            typeof (err as { status: unknown }).status === 'number'
              ? (err as { status: number }).status
              : 500;
          this.logger.warn(
            `${req.method} ${path} ${status} ${Date.now() - started}ms error=${
              err instanceof Error ? err.message : 'unknown_error'
            }`,
          );
        },
      }),
    );
  }
}
