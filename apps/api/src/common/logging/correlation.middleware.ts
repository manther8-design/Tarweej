import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { resolveCorrelationId, runWithRequestContext } from './request-context';

@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const correlationId = resolveCorrelationId(req.headers as Record<string, unknown>);
    const requestId = correlationId;
    res.setHeader('x-correlation-id', correlationId);
    res.setHeader('x-request-id', requestId);
    runWithRequestContext({ correlationId, requestId }, () => next());
  }
}
