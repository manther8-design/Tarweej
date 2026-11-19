export const PAYMENT_STATUSES = [
  'pending',
  'processing',
  'paid',
  'failed',
  'cancelled',
  'refunded',
  'partial',
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PROMOTION_STATUSES = ['scheduled', 'active', 'expired', 'cancelled'] as const;
export type PromotionStatus = (typeof PROMOTION_STATUSES)[number];

export const PAYMENT_PURPOSES = ['featured_promotion'] as const;
export type PaymentPurpose = (typeof PAYMENT_PURPOSES)[number];

export const MOCK_PAYMENT_PROVIDER_CODE = 'mock';

export const REGISTERED_PAYMENT_PROVIDERS = [MOCK_PAYMENT_PROVIDER_CODE] as const;
export type RegisteredPaymentProvider = (typeof REGISTERED_PAYMENT_PROVIDERS)[number];

export const PAYMENT_GATEWAY_PORT = Symbol('PAYMENT_GATEWAY_PORT');
export const PAYMENT_GATEWAY_REGISTRY = Symbol('PAYMENT_GATEWAY_REGISTRY');

export type CreatePaymentIntentInput = {
  paymentId: string;
  amount: string;
  currencyCode: string;
  purpose: PaymentPurpose;
  idempotencyKey: string;
  metadata?: Record<string, unknown>;
};

export type CreatePaymentIntentResult = {
  providerReference: string;
  providerStatus: 'accepted' | 'declined';
  checkoutToken?: string;
  rawResponseMeta?: Record<string, unknown>;
};

export type ParsedWebhookEvent = {
  providerEventId: string;
  paymentId: string;
  providerReference?: string;
  outcome: 'paid' | 'failed' | 'cancelled';
  failureReason?: string;
  rawPayload: Record<string, unknown>;
};

export interface PaymentGateway {
  readonly providerCode: string;
  createIntent(input: CreatePaymentIntentInput): Promise<CreatePaymentIntentResult>;
  verifyWebhookSignature(rawBody: string, signatureHeader: string | undefined): boolean;
  parseWebhook(payload: Record<string, unknown>): ParsedWebhookEvent;
}
