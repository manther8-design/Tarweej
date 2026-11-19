import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import type {
  CreatePaymentIntentInput,
  CreatePaymentIntentResult,
  ParsedWebhookEvent,
  PaymentGateway,
} from '../../domain/commercial.types';
import { MOCK_PAYMENT_PROVIDER_CODE } from '../../domain/commercial.types';

/**
 * Dev/sandbox payment adapter (ADR-010).
 * Never stores PAN/CVV. Success is confirmed only via signed webhook (or
 * the sandbox complete endpoint that synthesizes a signed webhook).
 */
@Injectable()
export class MockPaymentAdapter implements PaymentGateway {
  readonly providerCode = MOCK_PAYMENT_PROVIDER_CODE;

  constructor(private readonly config: ConfigService) {}

  get webhookSecret(): string {
    return (
      this.config.get<string>('PAYMENT_MOCK_WEBHOOK_SECRET') ??
      this.config.get<string>('JWT_ACCESS_SECRET') ??
      'dev-mock-payment-webhook-secret'
    );
  }

  async createIntent(input: CreatePaymentIntentInput): Promise<CreatePaymentIntentResult> {
    const providerReference = `mock_${input.paymentId.replace(/-/g, '').slice(0, 16)}_${randomUUID().slice(0, 8)}`;
    const checkoutToken = randomUUID();
    return {
      providerReference,
      providerStatus: 'accepted',
      checkoutToken,
      rawResponseMeta: {
        sandbox: true,
        purpose: input.purpose,
        amount: input.amount,
        currencyCode: input.currencyCode,
        checkoutToken,
      },
    };
  }

  verifyWebhookSignature(rawBody: string, signatureHeader: string | undefined): boolean {
    if (!signatureHeader) {
      return false;
    }
    const expected = this.sign(rawBody);
    try {
      const a = Buffer.from(expected);
      const b = Buffer.from(signatureHeader);
      return a.length === b.length && timingSafeEqual(a, b);
    } catch {
      return false;
    }
  }

  parseWebhook(payload: Record<string, unknown>): ParsedWebhookEvent {
    const providerEventId = String(payload.eventId ?? '');
    const paymentId = String(payload.paymentId ?? '');
    const outcomeRaw = String(payload.outcome ?? '').toLowerCase();
    if (!providerEventId || !paymentId) {
      throw new Error('Invalid mock webhook payload: missing eventId or paymentId');
    }
    if (outcomeRaw !== 'paid' && outcomeRaw !== 'failed' && outcomeRaw !== 'cancelled') {
      throw new Error(`Invalid mock webhook outcome: ${outcomeRaw}`);
    }
    return {
      providerEventId,
      paymentId,
      providerReference:
        typeof payload.providerReference === 'string' ? payload.providerReference : undefined,
      outcome: outcomeRaw,
      failureReason: typeof payload.failureReason === 'string' ? payload.failureReason : undefined,
      rawPayload: payload,
    };
  }

  sign(rawBody: string): string {
    return createHmac('sha256', this.webhookSecret).update(rawBody).digest('hex');
  }

  buildSignedWebhookBody(input: {
    paymentId: string;
    outcome: 'paid' | 'failed' | 'cancelled';
    providerReference?: string;
    failureReason?: string;
    eventId?: string;
  }): { rawBody: string; signature: string; payload: Record<string, unknown> } {
    const payload: Record<string, unknown> = {
      eventId: input.eventId ?? `mock_evt_${randomUUID()}`,
      paymentId: input.paymentId,
      outcome: input.outcome,
      providerReference: input.providerReference,
      failureReason: input.failureReason,
      occurredAt: new Date().toISOString(),
    };
    const rawBody = JSON.stringify(payload);
    return { rawBody, signature: this.sign(rawBody), payload };
  }
}
