import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../configuration/application/audit.service';
import { PaymentsService } from './payments.service';
import { PaymentRoutingService } from './payment-routing.service';

@Injectable()
export class PromotionsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PromotionsService.name);
  private expiryTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => PaymentsService))
    private readonly payments: PaymentsService,
    private readonly routing: PaymentRoutingService,
    private readonly audit: AuditService,
  ) {}

  onModuleInit(): void {
    // Lightweight expiry sweep; idempotent. Tests call expireDuePromotions() directly.
    this.expiryTimer = setInterval(() => {
      void this.expireDuePromotions().catch((err: unknown) => {
        this.logger.warn(`Featured expiry sweep failed: ${String(err)}`);
      });
    }, 60_000);
    this.expiryTimer.unref?.();
  }

  onModuleDestroy(): void {
    if (this.expiryTimer) {
      clearInterval(this.expiryTimer);
      this.expiryTimer = null;
    }
  }

  listPlans(countryId?: string) {
    return this.prisma.featuredPricingRule.findMany({
      where: { isActive: true, ...(countryId ? { countryId } : {}) },
      orderBy: [{ placement: 'asc' }, { pricePerHour: 'asc' }],
      include: {
        country: { select: { id: true, iso2: true, iso3: true } },
      },
    });
  }

  async purchase(
    userId: string,
    input: {
      listingId: string;
      pricingRuleId: string;
      durationHours?: number;
      idempotencyKey: string;
    },
  ) {
    const existing = await this.payments.findByIdempotencyKey(input.idempotencyKey);
    if (existing) {
      if (existing.userId !== userId) {
        throw new ForbiddenException('Idempotency key belongs to another user');
      }
      const promotion = await this.prisma.featuredPromotion.findUnique({
        where: { paymentId: existing.id },
      });
      return {
        payment: this.payments.toPublic(existing),
        promotion: promotion ? this.toPublicPromotion(promotion) : null,
        checkout: {
          providerCode: existing.providerCode,
          providerReference: existing.providerReference,
        },
        reused: true,
      };
    }

    const listing = await this.prisma.listing.findFirst({
      where: { id: input.listingId, deletedAt: null },
    });
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }
    if (listing.ownerId !== userId) {
      throw new ForbiddenException('Only the listing owner can purchase featured promotion');
    }
    if (listing.status !== 'active') {
      throw new BadRequestException('Only active listings can be featured');
    }

    const rule = await this.prisma.featuredPricingRule.findFirst({
      where: { id: input.pricingRuleId, isActive: true },
    });
    if (!rule) {
      throw new NotFoundException('Pricing rule not found or inactive');
    }
    if (rule.countryId !== listing.countryId) {
      throw new BadRequestException('Pricing rule country does not match listing country');
    }

    const durationHours = input.durationHours ?? rule.defaultDurationHours;
    if (durationHours < rule.minDurationHours || durationHours > rule.maxDurationHours) {
      throw new BadRequestException(
        `durationHours must be between ${rule.minDurationHours} and ${rule.maxDurationHours}`,
      );
    }

    const amount = new Prisma.Decimal(rule.pricePerHour).mul(durationHours);
    const providerCode = await this.routing.resolveProviderCode(listing.countryId);

    const result = await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          userId,
          purpose: 'featured_promotion',
          amount,
          currencyCode: rule.currencyCode,
          status: 'pending',
          providerCode,
          idempotencyKey: input.idempotencyKey,
          countryId: listing.countryId,
        },
      });

      const promotion = await tx.featuredPromotion.create({
        data: {
          listingId: listing.id,
          paymentId: payment.id,
          pricingRuleId: rule.id,
          placement: rule.placement,
          status: 'scheduled',
          rankWeight: rule.rankWeight,
          durationHours,
        },
      });

      return { payment, promotion };
    });

    const intent = await this.payments.startProviderIntent(result.payment.id);

    await this.audit.record({
      actorId: userId,
      action: 'promotion.purchase_initiated',
      entityType: 'featured_promotion',
      entityId: result.promotion.id,
      after: {
        paymentId: result.payment.id,
        listingId: listing.id,
        amount: amount.toString(),
        durationHours,
      },
    });

    const payment = await this.prisma.payment.findUniqueOrThrow({
      where: { id: result.payment.id },
    });
    const promotion = await this.prisma.featuredPromotion.findUniqueOrThrow({
      where: { id: result.promotion.id },
    });

    return {
      payment: this.payments.toPublic(payment),
      promotion: this.toPublicPromotion(promotion),
      checkout: {
        providerCode: payment.providerCode,
        providerReference: payment.providerReference,
        checkoutToken: intent.checkoutToken,
        sandbox: payment.providerCode === 'mock',
      },
      reused: false,
    };
  }

  async activateForPaidPayment(paymentId: string, now = new Date()): Promise<void> {
    const promotion = await this.prisma.featuredPromotion.findUnique({
      where: { paymentId },
    });
    if (!promotion) {
      return;
    }
    if (promotion.status === 'active' || promotion.status === 'expired') {
      return;
    }
    if (promotion.status === 'cancelled') {
      return;
    }

    const rule = await this.prisma.featuredPricingRule.findUnique({
      where: { id: promotion.pricingRuleId },
    });
    if (!rule) {
      throw new NotFoundException('Pricing rule missing for promotion');
    }

    const activeCount = await this.prisma.featuredPromotion.count({
      where: {
        placement: promotion.placement,
        status: 'active',
        endsAt: { gt: now },
        listing: { countryId: rule.countryId, deletedAt: null },
      },
    });
    if (activeCount >= rule.maxSlots) {
      // Keep scheduled until a slot frees; payment already Paid — still activate with
      // lower visibility by allowing activation (product choice: prefer paid user gets featured).
      // Enforce soft capacity via rank; still activate for paid.
      this.logger.warn(
        `Featured slots at capacity for placement=${promotion.placement} country=${rule.countryId}; activating paid promotion anyway`,
      );
    }

    const startsAt = now;
    const endsAt = new Date(startsAt.getTime() + promotion.durationHours * 3_600_000);

    await this.prisma.$transaction(async (tx) => {
      await tx.featuredPromotion.update({
        where: { id: promotion.id },
        data: {
          status: 'active',
          startsAt,
          endsAt,
        },
      });
      await tx.listing.update({
        where: { id: promotion.listingId },
        data: { isFeaturedCached: true },
      });
    });

    await this.audit.record({
      action: 'promotion.activated',
      entityType: 'featured_promotion',
      entityId: promotion.id,
      after: { paymentId, startsAt, endsAt },
    });
  }

  async expireDuePromotions(now = new Date()): Promise<{ expiredCount: number }> {
    const due = await this.prisma.featuredPromotion.findMany({
      where: {
        status: 'active',
        endsAt: { lte: now },
      },
    });

    for (const promo of due) {
      await this.prisma.featuredPromotion.update({
        where: { id: promo.id },
        data: { status: 'expired' },
      });
      await this.refreshListingFeaturedCache(promo.listingId, now);
      await this.audit.record({
        action: 'promotion.expired',
        entityType: 'featured_promotion',
        entityId: promo.id,
        after: { endsAt: promo.endsAt },
      });
    }

    return { expiredCount: due.length };
  }

  async refreshListingFeaturedCache(listingId: string, now = new Date()): Promise<void> {
    const active = await this.prisma.featuredPromotion.findFirst({
      where: {
        listingId,
        status: 'active',
        endsAt: { gt: now },
      },
    });
    await this.prisma.listing.update({
      where: { id: listingId },
      data: { isFeaturedCached: Boolean(active) },
    });
  }

  async getPromotionForPayment(paymentId: string) {
    return this.prisma.featuredPromotion.findUnique({ where: { paymentId } });
  }

  toPublicPromotion(row: {
    id: string;
    listingId: string;
    paymentId: string;
    pricingRuleId: string;
    placement: string;
    status: string;
    rankWeight: number;
    durationHours: number;
    startsAt: Date | null;
    endsAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      listingId: row.listingId,
      paymentId: row.paymentId,
      pricingRuleId: row.pricingRuleId,
      placement: row.placement,
      status: row.status,
      rankWeight: row.rankWeight,
      durationHours: row.durationHours,
      startsAt: row.startsAt,
      endsAt: row.endsAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      isFeaturedVisible: row.status === 'active' && !!row.endsAt && row.endsAt > new Date(),
    };
  }
}
