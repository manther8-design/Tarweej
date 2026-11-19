import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { AuditService } from '../../configuration/application/audit.service';
import {
  LISTING_STATUS_TRANSITIONS,
  type ListingStatus,
} from '../../listings/domain/listings.types';
import {
  REPORT_ACTIONS,
  REPORT_CLASSIFICATIONS,
  REPORT_CLOSE_STATUSES,
  REPORT_REASON_CODES,
  REPORT_STATUSES,
  type ReportAction,
  type ReportClassification,
  type ReportCloseStatus,
  type ReportReasonCode,
  type ReportStatus,
} from '../domain/reports.types';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(
    reporterId: string,
    input: {
      listingId?: string;
      targetUserId?: string;
      reasonCode: string;
      notes?: string;
    },
  ) {
    if (!input.listingId && !input.targetUserId) {
      throw new BadRequestException('Provide listingId and/or targetUserId');
    }
    if (!REPORT_REASON_CODES.includes(input.reasonCode as ReportReasonCode)) {
      throw new BadRequestException(
        `Invalid reasonCode. Expected one of: ${REPORT_REASON_CODES.join(', ')}`,
      );
    }
    if (input.targetUserId && input.targetUserId === reporterId) {
      throw new BadRequestException('Cannot report yourself');
    }

    let listingOwnerId: string | null = null;
    if (input.listingId) {
      const listing = await this.prisma.listing.findFirst({
        where: { id: input.listingId, deletedAt: null },
        select: { id: true, ownerId: true, status: true },
      });
      if (!listing || listing.status === 'deleted') {
        throw new NotFoundException(`Listing not found: ${input.listingId}`);
      }
      if (listing.ownerId === reporterId) {
        throw new BadRequestException('Cannot report your own listing');
      }
      listingOwnerId = listing.ownerId;
    }

    if (input.targetUserId) {
      const target = await this.prisma.user.findFirst({
        where: { id: input.targetUserId, deletedAt: null },
        select: { id: true },
      });
      if (!target) {
        throw new NotFoundException(`User not found: ${input.targetUserId}`);
      }
    }

    const targetUserId = input.targetUserId ?? listingOwnerId;

    const row = await this.prisma.report.create({
      data: {
        reporterId,
        listingId: input.listingId ?? null,
        targetUserId,
        reasonCode: input.reasonCode,
        notes: input.notes?.trim() || null,
        status: 'open',
      },
    });

    await this.audit.record({
      actorId: reporterId,
      action: 'report.create',
      entityType: 'report',
      entityId: row.id,
      after: this.toDto(row),
    });

    return this.toDto(row);
  }

  async listAdmin(
    input: {
      status?: string;
      page?: number;
      pageSize?: number;
    } = {},
  ) {
    const page = Math.max(input.page ?? 1, 1);
    const pageSize = Math.min(Math.max(input.pageSize ?? 20, 1), 100);
    const statusFilter = input.status?.trim();
    if (statusFilter && !REPORT_STATUSES.includes(statusFilter as ReportStatus)) {
      throw new BadRequestException(
        `Invalid status. Expected one of: ${REPORT_STATUSES.join(', ')}`,
      );
    }

    const where: Prisma.ReportWhereInput = statusFilter
      ? { status: statusFilter }
      : { status: { in: ['open', 'in_review'] } };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.report.count({ where }),
      this.prisma.report.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          reporter: { select: { id: true, email: true, displayName: true } },
          targetUser: { select: { id: true, email: true, displayName: true } },
          listing: { select: { id: true, title: true, status: true, ownerId: true } },
        },
      }),
    ]);

    return {
      page,
      pageSize,
      total,
      items: rows.map((row) => ({
        ...this.toDto(row),
        reporter: row.reporter,
        targetUser: row.targetUser,
        listing: row.listing,
      })),
    };
  }

  async getAdmin(id: string) {
    const row = await this.prisma.report.findUnique({
      where: { id },
      include: {
        reporter: { select: { id: true, email: true, displayName: true } },
        targetUser: { select: { id: true, email: true, displayName: true } },
        listing: { select: { id: true, title: true, status: true, ownerId: true } },
        resolvedBy: { select: { id: true, email: true, displayName: true } },
      },
    });
    if (!row) {
      throw new NotFoundException(`Report not found: ${id}`);
    }
    return {
      ...this.toDto(row),
      reporter: row.reporter,
      targetUser: row.targetUser,
      listing: row.listing,
      resolvedBy: row.resolvedBy,
    };
  }

  async classify(actorId: string, id: string, input: { classification: string; notes?: string }) {
    const report = await this.requireOpenOrInReview(id);
    if (!REPORT_CLASSIFICATIONS.includes(input.classification as ReportClassification)) {
      throw new BadRequestException(
        `Invalid classification. Expected one of: ${REPORT_CLASSIFICATIONS.join(', ')}`,
      );
    }

    const updated = await this.prisma.report.update({
      where: { id },
      data: {
        classification: input.classification,
        status: 'in_review',
        notes: input.notes?.trim()
          ? [report.notes, input.notes.trim()].filter(Boolean).join('\n')
          : report.notes,
      },
    });

    await this.audit.record({
      actorId,
      action: 'report.classify',
      entityType: 'report',
      entityId: id,
      before: { status: report.status, classification: report.classification },
      after: {
        status: updated.status,
        classification: updated.classification,
      },
    });

    return this.toDto(updated);
  }

  async act(actorId: string, id: string, input: { action: string; notes?: string }) {
    const report = await this.requireOpenOrInReview(id);
    if (!REPORT_ACTIONS.includes(input.action as ReportAction)) {
      throw new BadRequestException(
        `Invalid action. Expected one of: ${REPORT_ACTIONS.join(', ')}`,
      );
    }

    let listingBefore: { id: string; status: string } | null = null;
    let listingAfter: { id: string; status: string } | null = null;

    if (input.action === 'hide_listing') {
      if (!report.listingId) {
        throw new BadRequestException('Report has no listing to hide');
      }
      const listing = await this.prisma.listing.findFirst({
        where: { id: report.listingId, deletedAt: null },
      });
      if (!listing) {
        throw new NotFoundException(`Listing not found: ${report.listingId}`);
      }
      listingBefore = { id: listing.id, status: listing.status };
      const from = listing.status as ListingStatus;
      const allowed = LISTING_STATUS_TRANSITIONS[from] ?? [];
      if (!allowed.includes('paused') && from !== 'paused') {
        throw new BadRequestException(`Cannot hide listing from status=${listing.status}`);
      }
      if (from !== 'paused') {
        const updatedListing = await this.prisma.listing.update({
          where: { id: listing.id },
          data: { status: 'paused' },
        });
        await this.prisma.listingStatusHistory.create({
          data: {
            listingId: listing.id,
            fromStatus: listing.status,
            toStatus: 'paused',
            actorId,
            reason: input.notes?.trim() || `Hidden via report ${id}`,
          },
        });
        listingAfter = { id: updatedListing.id, status: updatedListing.status };
      } else {
        listingAfter = listingBefore;
      }
    }

    const updated = await this.prisma.report.update({
      where: { id },
      data: {
        resolutionAction: input.action,
        status: report.status === 'open' ? 'in_review' : report.status,
        notes: input.notes?.trim()
          ? [report.notes, input.notes.trim()].filter(Boolean).join('\n')
          : report.notes,
      },
    });

    await this.audit.record({
      actorId,
      action: 'report.act',
      entityType: 'report',
      entityId: id,
      before: { resolutionAction: report.resolutionAction, listing: listingBefore },
      after: {
        resolutionAction: updated.resolutionAction,
        listing: listingAfter,
      },
      metadata: input.notes ? { notes: input.notes.trim() } : undefined,
    });

    return this.toDto(updated);
  }

  async close(actorId: string, id: string, input: { status: string; reason: string }) {
    const report = await this.requireOpenOrInReview(id);
    if (!REPORT_CLOSE_STATUSES.includes(input.status as ReportCloseStatus)) {
      throw new BadRequestException(
        `Invalid close status. Expected one of: ${REPORT_CLOSE_STATUSES.join(', ')}`,
      );
    }
    const reason = input.reason?.trim();
    if (!reason) {
      throw new BadRequestException('Close reason is required');
    }

    const updated = await this.prisma.report.update({
      where: { id },
      data: {
        status: input.status,
        resolutionReason: reason,
        resolvedById: actorId,
        resolvedAt: new Date(),
      },
    });

    await this.audit.record({
      actorId,
      action: `report.${input.status}`,
      entityType: 'report',
      entityId: id,
      before: { status: report.status },
      after: this.toDto(updated),
      metadata: { reason },
    });

    return this.toDto(updated);
  }

  private async requireOpenOrInReview(id: string) {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) {
      throw new NotFoundException(`Report not found: ${id}`);
    }
    if (report.status !== 'open' && report.status !== 'in_review') {
      throw new BadRequestException(`Report is already closed with status=${report.status}`);
    }
    return report;
  }

  private toDto(row: {
    id: string;
    reporterId: string;
    listingId: string | null;
    targetUserId: string | null;
    reasonCode: string;
    notes: string | null;
    status: string;
    classification: string | null;
    resolutionAction: string | null;
    resolutionReason: string | null;
    resolvedById: string | null;
    resolvedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      reporterId: row.reporterId,
      listingId: row.listingId,
      targetUserId: row.targetUserId,
      reasonCode: row.reasonCode,
      notes: row.notes,
      status: row.status,
      classification: row.classification,
      resolutionAction: row.resolutionAction,
      resolutionReason: row.resolutionReason,
      resolvedById: row.resolvedById,
      resolvedAt: row.resolvedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
