import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../configuration/application/audit.service';
import { NotificationsService } from '../../notifications/application/notifications.service';
import { MockPaymentAdapter } from '../adapters/payments/mock-payment.adapter';
import type { PaymentStatus } from '../domain/commercial.types';
import { PaymentRoutingService } from './payment-routing.service';
import { PromotionsService } from './promotions.service';

const TERMINAL: ReadonlySet<PaymentStatus> = new Set(['paid', 'failed', 'cancelled', 'refunded']);

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly routing: PaymentRoutingService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationsService,
    private readonly mockAdapter: MockPaymentAdapter,
    @Inject(forwardRef(() => PromotionsService))
    private readonly promotions: PromotionsService,
  ) {}

  toPublic(row: {
    id: string;
    userId: string;
    purpose: string;
    amount: Prisma.Decimal;
    currencyCode: string;
    status: string;
    providerCode: string;
    idempotencyKey: string;
    providerReference: string | null;
    countryId: string | null;
    failureReason: string | null;
    paidAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      userId: row.userId,
      purpose: row.purpose,
      amount: row.amount.toString(),
      currencyCode: row.currencyCode,
      status: row.status,
      providerCode: row.providerCode,
      idempotencyKey: row.idempotencyKey,
      providerReference: row.providerReference,
      countryId: row.countryId,
      failureReason: row.failureReason,
      paidAt: row.paidAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  findByIdempotencyKey(idempotencyKey: string) {
    return this.prisma.payment.findUnique({ where: { idempotencyKey } });
  }

  async listForUser(userId: string, input?: { page?: number; pageSize?: number }) {
    const page = Math.max(input?.page ?? 1, 1);
    const pageSize = Math.min(Math.max(input?.pageSize ?? 20, 1), 100);
    const where = { userId };
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.payment.count({ where }),
      this.prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { promotion: true },
      }),
    ]);
    return {
      page,
      pageSize,
      total,
      items: rows.map((row) => ({
        ...this.toPublic(row),
        promotion: row.promotion ? this.promotions.toPublicPromotion(row.promotion) : null,
      })),
    };
  }

  async getForUser(userId: string, paymentId: string) {
    const row = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { promotion: true, attempts: { orderBy: { createdAt: 'desc' }, take: 10 } },
    });
    if (!row) {
      throw new NotFoundException('Payment not found');
    }
    if (row.userId !== userId) {
      throw new ForbiddenException('Not your payment');
    }
    return {
      ...this.toPublic(row),
      promotion: row.promotion ? this.promotions.toPublicPromotion(row.promotion) : null,
      attempts: row.attempts.map((a) => ({
        id: a.id,
        providerStatus: a.providerStatus,
        createdAt: a.createdAt,
      })),
    };
  }

  async startProviderIntent(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    if (payment.status !== 'pending' && payment.status !== 'processing') {
      throw new BadRequestException(`Cannot start intent for status=${payment.status}`);
    }

    const adapter = this.routing.getAdapter(payment.providerCode);
    const intent = await adapter.createIntent({
      paymentId: payment.id,
      amount: payment.amount.toString(),
      currencyCode: payment.currencyCode,
      purpose: payment.purpose as 'featured_promotion',
      idempotencyKey: payment.idempotencyKey,
      metadata: { countryId: payment.countryId },
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.paymentAttempt.create({
        data: {
          paymentId: payment.id,
          providerStatus: intent.providerStatus,
          rawRequestMeta: {
            amount: payment.amount.toString(),
            currencyCode: payment.currencyCode,
            idempotencyKey: payment.idempotencyKey,
          } as Prisma.InputJsonValue,
          rawResponseMeta: (intent.rawResponseMeta ?? {}) as Prisma.InputJsonValue,
        },
      });
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: intent.providerStatus === 'accepted' ? 'processing' : 'failed',
          providerReference: intent.providerReference,
          failureReason: intent.providerStatus === 'declined' ? 'Provider declined intent' : null,
        },
      });
    });

    return intent;
  }

  /**
   * Sandbox helper for mock provider. Synthesizes a signed webhook so client
   * never marks Paid on its own (ADR-010).
   */
  async mockComplete(
    userId: string,
    paymentId: string,
    outcome: 'paid' | 'failed' | 'cancelled' = 'paid',
  ) {
    const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    if (payment.userId !== userId) {
      throw new ForbiddenException('Not your payment');
    }
    if (payment.providerCode !== 'mock') {
      throw new BadRequestException('mock-complete is only available for mock provider');
    }

    const signed = this.mockAdapter.buildSignedWebhookBody({
      paymentId: payment.id,
      outcome,
      providerReference: payment.providerReference ?? undefined,
      failureReason: outcome === 'failed' ? 'Sandbox simulated failure' : undefined,
    });

    return this.processWebhook('mock', signed.rawBody, signed.signature);
  }

  async processWebhook(providerCode: string, rawBody: string, signatureHeader: string | undefined) {
    const adapter = this.routing.getAdapter(providerCode);
    const signatureValid = adapter.verifyWebhookSignature(rawBody, signatureHeader);

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      throw new BadRequestException('Webhook body must be JSON');
    }

    if (!signatureValid) {
      // Persist failed verify for audit; do not mutate payment.
      const eventId =
        typeof payload.eventId === 'string'
          ? `${payload.eventId}:invalid-sig:${Date.now()}`
          : `invalid-sig:${Date.now()}`;
      await this.prisma.webhookEvent.create({
        data: {
          providerCode,
          providerEventId: eventId,
          paymentId: typeof payload.paymentId === 'string' ? payload.paymentId : null,
          signatureValid: false,
          payload: payload as Prisma.InputJsonValue,
        },
      });
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const parsed = adapter.parseWebhook(payload);

    const existingEvent = await this.prisma.webhookEvent.findUnique({
      where: { providerEventId: parsed.providerEventId },
    });
    if (existingEvent?.processedAt) {
      const payment = await this.prisma.payment.findUnique({
        where: { id: parsed.paymentId },
      });
      return {
        duplicate: true,
        payment: payment ? this.toPublic(payment) : null,
      };
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: parsed.paymentId },
    });
    if (!payment) {
      throw new NotFoundException('Payment referenced by webhook not found');
    }
    if (payment.providerCode !== providerCode) {
      throw new BadRequestException('Webhook provider mismatch');
    }

    const applied = await this.prisma.$transaction(async (tx) => {
      const event = await tx.webhookEvent.upsert({
        where: { providerEventId: parsed.providerEventId },
        update: {},
        create: {
          providerCode,
          providerEventId: parsed.providerEventId,
          paymentId: payment.id,
          signatureValid: true,
          payload: parsed.rawPayload as Prisma.InputJsonValue,
        },
      });

      if (event.processedAt) {
        return { payment, changed: false };
      }

      const nextStatus = this.mapOutcome(parsed.outcome);
      const current = payment.status as PaymentStatus;
      if (!this.canTransition(current, nextStatus)) {
        await tx.webhookEvent.update({
          where: { id: event.id },
          data: { processedAt: new Date() },
        });
        return { payment, changed: false };
      }

      const updated = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: nextStatus,
          providerReference: parsed.providerReference ?? payment.providerReference,
          failureReason: parsed.failureReason ?? null,
          paidAt: nextStatus === 'paid' ? new Date() : payment.paidAt,
        },
      });

      await tx.paymentAttempt.create({
        data: {
          paymentId: payment.id,
          providerStatus: parsed.outcome,
          rawResponseMeta: parsed.rawPayload as Prisma.InputJsonValue,
        },
      });

      await tx.webhookEvent.update({
        where: { id: event.id },
        data: { processedAt: new Date(), paymentId: payment.id },
      });

      return { payment: updated, changed: true };
    });

    if (applied.changed && applied.payment.status === 'paid') {
      await this.promotions.activateForPaidPayment(applied.payment.id);
    }

    if (applied.changed) {
      await this.audit.record({
        action: `payment.${applied.payment.status}`,
        entityType: 'payment',
        entityId: applied.payment.id,
        after: this.toPublic(applied.payment),
        metadata: { providerEventId: parsed.providerEventId },
      });

      if (applied.payment.status === 'paid') {
        await this.notifications.notify({
          userId: applied.payment.userId,
          templateCode: 'payment.success',
          payload: {
            paymentId: applied.payment.id,
            amount: applied.payment.amount.toString(),
            currencyCode: applied.payment.currencyCode,
          },
        });
      } else if (applied.payment.status === 'failed') {
        await this.notifications.notify({
          userId: applied.payment.userId,
          templateCode: 'payment.failed',
          payload: {
            paymentId: applied.payment.id,
            failureReason: applied.payment.failureReason ?? 'payment_failed',
          },
        });
      }
    }

    const refreshed = await this.prisma.payment.findUniqueOrThrow({
      where: { id: payment.id },
      include: { promotion: true },
    });

    return {
      duplicate: !applied.changed,
      payment: this.toPublic(refreshed),
      promotion: refreshed.promotion
        ? this.promotions.toPublicPromotion(refreshed.promotion)
        : null,
    };
  }

  private mapOutcome(outcome: 'paid' | 'failed' | 'cancelled'): PaymentStatus {
    if (outcome === 'paid') return 'paid';
    if (outcome === 'failed') return 'failed';
    return 'cancelled';
  }

  private canTransition(from: PaymentStatus, to: PaymentStatus): boolean {
    if (from === to) {
      return false;
    }
    if (TERMINAL.has(from) && to !== 'refunded' && to !== 'partial') {
      return false;
    }
    const allowed: Record<PaymentStatus, PaymentStatus[]> = {
      pending: ['processing', 'failed', 'cancelled'],
      processing: ['paid', 'failed', 'cancelled'],
      paid: ['refunded', 'partial'],
      failed: [],
      cancelled: [],
      refunded: [],
      partial: ['refunded'],
    };
    return allowed[from]?.includes(to) ?? false;
  }
}
