/** Shared API contract stubs (DTOs / OpenAPI-aligned types). */

export interface ApiErrorBody {
  statusCode: number;
  message: string | string[];
  error?: string;
}

export interface HealthLiveResponse {
  status: 'ok';
}

export interface HealthReadyResponse {
  status: 'ready';
  database: 'connected';
}

export interface PlatformInfoResponse {
  name: string;
  product: string;
  status: string;
  documentation: string;
}

export interface PublicSetting {
  key: string;
  value: unknown;
  description: string | null;
  updatedAt: string;
}

export interface PublicFeatureFlag {
  key: string;
  isEnabled: boolean;
  description: string | null;
  updatedAt: string;
}
