/**
 * CORS origin helpers for Tarweej API.
 *
 * Production: exact allow-list from `CORS_ORIGINS` only.
 * Non-production: also allow Flutter web / local browsers on
 * `localhost` or `127.0.0.1` (any port), so Chrome's random Flutter
 * web port (e.g. `:61808`) works without updating env on every run.
 */

/** Matches http(s)://localhost[:port] and http(s)://127.0.0.1[:port]. */
export const LOCAL_DEV_ORIGIN_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;

export type CorsOriginCallback = (err: Error | null, allow?: boolean) => void;

export function isLocalDevOrigin(origin: string): boolean {
  return LOCAL_DEV_ORIGIN_RE.test(origin);
}

export function parseCorsOrigins(raw: string | undefined): string[] {
  return (raw ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

export function createCorsOriginDelegate(options: {
  nodeEnv: string;
  configuredOrigins: string[];
}): (origin: string | undefined, callback: CorsOriginCallback) => void {
  const allowLocalLoopback = options.nodeEnv !== 'production';
  const allowlist = new Set(options.configuredOrigins);

  return (origin, callback) => {
    // Same-origin / non-browser clients often omit Origin.
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowlist.has(origin)) {
      callback(null, true);
      return;
    }

    if (allowLocalLoopback && isLocalDevOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(null, false);
  };
}
