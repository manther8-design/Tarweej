/** Thin shared config helpers for TypeScript apps. */

export interface TarweejRuntimeConfig {
  nodeEnv: string;
  apiBaseUrl: string;
}

export function readApiBaseUrl(
  env: NodeJS.ProcessEnv = process.env,
  fallback = 'http://localhost:3000/api/v1',
): string {
  return env.NEXT_PUBLIC_API_BASE_URL ?? env.API_BASE_URL ?? fallback;
}
