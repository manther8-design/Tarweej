/** Listing lifecycle statuses (domain state machine). */
export const LISTING_STATUSES = [
  'draft',
  'pending_review',
  'active',
  'rejected',
  'paused',
  'expired',
  'archived',
  'deleted',
] as const;

export type ListingStatus = (typeof LISTING_STATUSES)[number];

/** Allowed transitions: from → to[]. */
export const LISTING_STATUS_TRANSITIONS: Record<ListingStatus, readonly ListingStatus[]> = {
  draft: ['pending_review', 'deleted'],
  pending_review: ['active', 'rejected', 'draft'],
  rejected: ['draft'],
  active: ['paused', 'expired', 'archived', 'deleted'],
  paused: ['active', 'archived'],
  expired: ['draft', 'archived'],
  archived: ['deleted'],
  deleted: [],
};

export const LISTING_MEDIA_STATUSES = ['pending', 'ready', 'failed', 'deleted'] as const;
export type ListingMediaStatus = (typeof LISTING_MEDIA_STATUSES)[number];

export const OBJECT_STORAGE_PORT = Symbol('OBJECT_STORAGE_PORT');

export type StoredObject = {
  storageKey: string;
  /** Public or CDN-style URL (may be a local stub). */
  publicUrl: string;
  mimeType: string;
  byteSize: number;
};

export interface ObjectStoragePort {
  putObject(input: { key: string; body: Buffer; mimeType: string }): Promise<StoredObject>;
  deleteObject(key: string): Promise<void>;
  getPublicUrl(key: string): string;
}
