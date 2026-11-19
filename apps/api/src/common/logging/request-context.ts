import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

export type RequestContextStore = {
  correlationId: string;
  requestId: string;
};

const storage = new AsyncLocalStorage<RequestContextStore>();

export function runWithRequestContext<T>(store: RequestContextStore, fn: () => T): T {
  return storage.run(store, fn);
}

export function getRequestContext(): RequestContextStore | undefined {
  return storage.getStore();
}

export function getCorrelationId(): string | undefined {
  return storage.getStore()?.correlationId;
}

/** Prefer inbound correlation/request headers; otherwise mint a UUID. */
export function resolveCorrelationId(headers: Record<string, unknown>): string {
  const raw = headers['x-correlation-id'] ?? headers['x-request-id'] ?? headers['x-amzn-trace-id'];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value === 'string' && value.trim().length > 0 && value.length <= 128) {
    return value.trim();
  }
  return randomUUID();
}
