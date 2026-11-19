import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../configuration/application/audit.service';

@Injectable()
export class PricingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  listPublic(countryId?: string) {
    return this.prisma.featuredPricingRule.findMany({
      where: {
        isActive: true,
        ...(countryId ? { countryId } : {}),
      },
      orderBy: [{ placement: 'asc' }, { pricePerHour: 'asc' }],
      include: {
        country: { select: { id: true, iso2: true, iso3: true } },
      },
    });
  }

  listAdmin() {
    return this.prisma.featuredPricingRule.findMany({
      orderBy: [{ countryId: 'asc' }, { placement: 'asc' }],
      include: {
        country: { select: { id: true, iso2: true, iso3: true } },
      },
    });
  }

  async upsertAdmin(
    actorId: string,
    input: {
      id?: string;
      countryId: string;
      currencyCode: string;
      placement: string;
      pricePerHour: number;
      maxSlots: number;
      defaultDurationHours: number;
      minDurationHours: number;
      maxDurationHours: number;
      rankWeight: number;
      isActive: boolean;
    },
  ) {
    if (input.minDurationHours < 1) {
      throw new BadRequestException('minDurationHours must be >= 1');
    }
    if (input.maxDurationHours < input.minDurationHours) {
      throw new BadRequestException('maxDurationHours must be >= minDurationHours');
    }
    if (
      input.defaultDurationHours < input.minDurationHours ||
      input.defaultDurationHours > input.maxDurationHours
    ) {
      throw new BadRequestException('defaultDurationHours must be within min/max range');
    }
    if (input.pricePerHour < 0) {
      throw new BadRequestException('pricePerHour must be >= 0');
    }

    const country = await this.prisma.country.findUnique({ where: { id: input.countryId } });
    if (!country) {
      throw new BadRequestException('Unknown countryId');
    }

    const currency = input.currencyCode.toUpperCase();
    const data = {
      countryId: input.countryId,
      currencyCode: currency,
      placement: input.placement,
      pricePerHour: new Prisma.Decimal(input.pricePerHour),
      maxSlots: input.maxSlots,
      defaultDurationHours: input.defaultDurationHours,
      minDurationHours: input.minDurationHours,
      maxDurationHours: input.maxDurationHours,
      rankWeight: input.rankWeight,
      isActive: input.isActive,
    };

    let before: unknown = null;
    let row;
    if (input.id) {
      const existing = await this.prisma.featuredPricingRule.findUnique({
        where: { id: input.id },
      });
      if (!existing) {
        throw new NotFoundException('Pricing rule not found');
      }
      before = existing;
      row = await this.prisma.featuredPricingRule.update({
        where: { id: input.id },
        data,
        include: { country: { select: { id: true, iso2: true, iso3: true } } },
      });
    } else {
      row = await this.prisma.featuredPricingRule.upsert({
        where: {
          countryId_placement_currencyCode: {
            countryId: input.countryId,
            placement: input.placement,
            currencyCode: currency,
          },
        },
        update: data,
        create: data,
        include: { country: { select: { id: true, iso2: true, iso3: true } } },
      });
    }

    await this.audit.record({
      actorId,
      action: before ? 'pricing_rule.update' : 'pricing_rule.upsert',
      entityType: 'featured_pricing_rule',
      entityId: row.id,
      before,
      after: row,
    });

    return row;
  }
}
