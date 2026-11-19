import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    const now = new Date();

    const [
      usersTotal,
      usersActive,
      listingGroups,
      paymentsTotal,
      paymentsByStatus,
      openReports,
      inReviewReports,
      featuredActive,
      pendingListings,
      recentAudit,
    ] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { deletedAt: null, status: 'active' } }),
      this.prisma.listing.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: { _all: true },
      }),
      this.prisma.payment.count(),
      this.prisma.payment.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.report.count({ where: { status: 'open' } }),
      this.prisma.report.count({ where: { status: 'in_review' } }),
      this.prisma.featuredPromotion.count({
        where: {
          status: 'active',
          OR: [{ endsAt: null }, { endsAt: { gt: now } }],
        },
      }),
      this.prisma.listing.count({
        where: { deletedAt: null, status: 'pending_review' },
      }),
      this.prisma.auditEntry.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: {
          actor: { select: { id: true, email: true, displayName: true } },
        },
      }),
    ]);

    const listingsByStatus: Record<string, number> = {};
    let listingsTotal = 0;
    for (const row of listingGroups) {
      listingsByStatus[row.status] = row._count._all;
      listingsTotal += row._count._all;
    }

    const paymentsStatus: Record<string, number> = {};
    for (const row of paymentsByStatus) {
      paymentsStatus[row.status] = row._count._all;
    }

    return {
      generatedAt: now.toISOString(),
      users: {
        total: usersTotal,
        active: usersActive,
      },
      listings: {
        total: listingsTotal,
        byStatus: listingsByStatus,
        pendingReview: pendingListings,
      },
      payments: {
        total: paymentsTotal,
        byStatus: paymentsStatus,
      },
      reports: {
        open: openReports,
        inReview: inReviewReports,
        queue: openReports + inReviewReports,
      },
      featured: {
        active: featuredActive,
      },
      recentAudit: recentAudit.map((entry) => ({
        id: entry.id,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        createdAt: entry.createdAt,
        actor: entry.actor
          ? {
              id: entry.actor.id,
              email: entry.actor.email,
              displayName: entry.actor.displayName,
            }
          : null,
      })),
    };
  }
}
