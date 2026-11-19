import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { ObjectStoragePort, StoredObject } from '../../modules/listings/domain/listings.types';

/**
 * Local filesystem object storage (dev/test). Bytes never enter Postgres.
 * Public URLs are CDN stubs pointing at the API media proxy route.
 */
@Injectable()
export class LocalObjectStorageAdapter implements ObjectStoragePort {
  private readonly logger = new Logger(LocalObjectStorageAdapter.name);
  private readonly root: string;
  private readonly publicBaseUrl: string;

  constructor(config: ConfigService) {
    this.root = config.get<string>('storage.localRoot') ?? '.data/object-storage';
    this.publicBaseUrl = (
      config.get<string>('storage.publicBaseUrl') ?? 'http://localhost:3000/api/v1/media'
    ).replace(/\/$/, '');
  }

  async putObject(input: { key: string; body: Buffer; mimeType: string }): Promise<StoredObject> {
    const abs = join(this.root, input.key);
    await mkdir(dirname(abs), { recursive: true });
    await writeFile(abs, input.body);
    this.logger.debug(`Stored local object ${input.key} (${input.body.byteLength} bytes)`);
    return {
      storageKey: input.key,
      publicUrl: this.getPublicUrl(input.key),
      mimeType: input.mimeType,
      byteSize: input.body.byteLength,
    };
  }

  async deleteObject(key: string): Promise<void> {
    const abs = join(this.root, key);
    try {
      await unlink(abs);
    } catch {
      // idempotent
    }
  }

  getPublicUrl(key: string): string {
    const encoded = key.split('/').map(encodeURIComponent).join('/');
    return `${this.publicBaseUrl}/${encoded}`;
  }
}

/** Deterministic content hash helper for storage keys. */
export function contentHash(body: Buffer): string {
  return createHash('sha256').update(body).digest('hex').slice(0, 32);
}
