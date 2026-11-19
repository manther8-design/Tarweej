import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, createHmac } from 'node:crypto';
import type { ObjectStoragePort, StoredObject } from '../../modules/listings/domain/listings.types';

/**
 * S3-compatible object storage (MinIO / AWS) via SigV4 signed HTTP.
 * Avoids a hard AWS SDK dependency for local MinIO while remaining swappable.
 */
@Injectable()
export class S3ObjectStorageAdapter implements ObjectStoragePort {
  private readonly logger = new Logger(S3ObjectStorageAdapter.name);
  private readonly endpoint: string;
  private readonly region: string;
  private readonly accessKey: string;
  private readonly secretKey: string;
  private readonly bucket: string;
  private readonly forcePathStyle: boolean;
  private readonly publicBaseUrl: string;

  constructor(config: ConfigService) {
    this.endpoint = (config.get<string>('storage.s3.endpoint') ?? 'http://localhost:9000').replace(
      /\/$/,
      '',
    );
    this.region = config.get<string>('storage.s3.region') ?? 'us-east-1';
    this.accessKey = config.get<string>('storage.s3.accessKey') ?? 'tarweej_minio';
    this.secretKey = config.get<string>('storage.s3.secretKey') ?? 'tarweej_minio_dev_password';
    this.bucket = config.get<string>('storage.s3.bucket') ?? 'tarweej-dev';
    this.forcePathStyle = config.get<boolean>('storage.s3.forcePathStyle') ?? true;
    this.publicBaseUrl = (
      config.get<string>('storage.publicBaseUrl') ?? `${this.endpoint}/${this.bucket}`
    ).replace(/\/$/, '');
  }

  async putObject(input: { key: string; body: Buffer; mimeType: string }): Promise<StoredObject> {
    const url = this.objectUrl(input.key);
    const amzDate = this.amzDate();
    const dateStamp = amzDate.slice(0, 8);
    const payloadHash = createHash('sha256').update(input.body).digest('hex');
    const headers: Record<string, string> = {
      host: new URL(this.endpoint).host,
      'content-type': input.mimeType,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate,
    };
    headers.authorization = this.sign('PUT', input.key, headers, payloadHash, dateStamp, amzDate);

    const res = await fetch(url, {
      method: 'PUT',
      headers,
      body: new Uint8Array(input.body),
    });
    if (!res.ok) {
      const text = await res.text();
      this.logger.error(`S3 put failed ${res.status}: ${text}`);
      throw new Error(`Object storage put failed (${res.status})`);
    }

    return {
      storageKey: input.key,
      publicUrl: this.getPublicUrl(input.key),
      mimeType: input.mimeType,
      byteSize: input.body.byteLength,
    };
  }

  async deleteObject(key: string): Promise<void> {
    const url = this.objectUrl(key);
    const amzDate = this.amzDate();
    const dateStamp = amzDate.slice(0, 8);
    const payloadHash = createHash('sha256').update('').digest('hex');
    const headers: Record<string, string> = {
      host: new URL(this.endpoint).host,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate,
    };
    headers.authorization = this.sign('DELETE', key, headers, payloadHash, dateStamp, amzDate);
    const res = await fetch(url, { method: 'DELETE', headers });
    if (!res.ok && res.status !== 404) {
      const text = await res.text();
      this.logger.warn(`S3 delete failed ${res.status}: ${text}`);
    }
  }

  getPublicUrl(key: string): string {
    const encoded = key.split('/').map(encodeURIComponent).join('/');
    return `${this.publicBaseUrl}/${encoded}`;
  }

  private objectUrl(key: string): string {
    const encoded = key.split('/').map(encodeURIComponent).join('/');
    if (this.forcePathStyle) {
      return `${this.endpoint}/${this.bucket}/${encoded}`;
    }
    const host = new URL(this.endpoint);
    return `${host.protocol}//${this.bucket}.${host.host}/${encoded}`;
  }

  private amzDate(): string {
    return new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
  }

  private sign(
    method: string,
    key: string,
    headers: Record<string, string>,
    payloadHash: string,
    dateStamp: string,
    amzDate: string,
  ): string {
    const canonicalUri = this.forcePathStyle
      ? `/${this.bucket}/${key.split('/').map(encodeURIComponent).join('/')}`
      : `/${key.split('/').map(encodeURIComponent).join('/')}`;
    const signedHeaderNames = Object.keys(headers)
      .map((h) => h.toLowerCase())
      .sort();
    const headerLookup = new Map(
      Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v] as const),
    );
    const canonicalHeaders = signedHeaderNames
      .map((name) => `${name}:${headerLookup.get(name) ?? ''}\n`)
      .join('');
    const signedHeaders = signedHeaderNames.join(';');
    const canonicalRequest = [
      method,
      canonicalUri,
      '',
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join('\n');
    const credentialScope = `${dateStamp}/${this.region}/s3/aws4_request`;
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      createHash('sha256').update(canonicalRequest).digest('hex'),
    ].join('\n');
    const signingKey = this.getSignatureKey(dateStamp);
    const signature = createHmac('sha256', signingKey).update(stringToSign).digest('hex');
    return `AWS4-HMAC-SHA256 Credential=${this.accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  }

  private getSignatureKey(dateStamp: string): Buffer {
    const kDate = createHmac('sha256', `AWS4${this.secretKey}`).update(dateStamp).digest();
    const kRegion = createHmac('sha256', kDate).update(this.region).digest();
    const kService = createHmac('sha256', kRegion).update('s3').digest();
    return createHmac('sha256', kService).update('aws4_request').digest();
  }
}
