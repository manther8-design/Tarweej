/** Thin database helpers shared across Nest apps/workers. */

export const PRISMA_SCHEMA_PATH = 'prisma/schema.prisma';

export function assertDatabaseUrl(url: string | undefined): string {
  if (!url) {
    throw new Error('DATABASE_URL is required');
  }
  return url;
}
