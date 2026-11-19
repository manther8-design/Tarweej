import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { contentHash } from '../../../infrastructure/object-storage/local-object-storage.adapter';
import { AuditService } from '../../configuration/application/audit.service';
import { CatalogService } from '../../catalog/application/catalog.service';
import {
  LISTING_STATUS_TRANSITIONS,
  OBJECT_STORAGE_PORT,
  type ListingStatus,
  type ObjectStoragePort,
} from '../domain/listings.types';
import type {
  CreateListingDto,
  ListingAttributeInputDto,
  UpdateListingDto,
} from '../adapters/http/dto/listings.dto';

const EDITABLE_STATUSES: ListingStatus[] = ['draft', 'rejected'];

const listingInclude = {
  media: { orderBy: [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }] },
  attributeValues: {
    include: { attributeDefinition: true },
    orderBy: { createdAt: 'asc' as const },
  },
} satisfies Prisma.ListingInclude;

@Injectable()
export class ListingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly catalog: CatalogService,
    @Inject(OBJECT_STORAGE_PORT) private readonly storage: ObjectStoragePort,
  ) {}

  // ---------------------------------------------------------------------------
  // Public
  // ---------------------------------------------------------------------------

  async listPublic(input: {
    categoryId?: string;
    countryId?: string;
    listingType?: string;
    page?: number;
    pageSize?: number;
  }) {
    const page = Math.max(input.page ?? 1, 1);
    const pageSize = Math.min(Math.max(input.pageSize ?? 20, 1), 100);
    const where: Prisma.ListingWhereInput = {
      status: 'active',
      deletedAt: null,
      ...(input.categoryId ? { categoryId: input.categoryId } : {}),
      ...(input.countryId ? { countryId: input.countryId } : {}),
      ...(input.listingType ? { listingType: input.listingType } : {}),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.listing.count({ where }),
      this.prisma.listing.findMany({
        where,
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          media: {
            where: { status: 'ready' },
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
            take: 1,
          },
        },
      }),
    ]);

    return {
      page,
      pageSize,
      total,
      items: rows.map((row) => this.toPublicSummary(row)),
    };
  }

  async getPublicActive(id: string) {
    const listing = await this.prisma.listing.findFirst({
      where: { id, status: 'active', deletedAt: null },
      include: listingInclude,
    });
    if (!listing) {
      throw new NotFoundException(`Listing not found: ${id}`);
    }
    return this.toDetail(listing);
  }

  async recordView(
    id: string,
    input: { viewerId?: string | null; fingerprint?: string | null } = {},
  ) {
    const listing = await this.prisma.listing.findFirst({
      where: { id, status: 'active', deletedAt: null },
      select: { id: true, viewCount: true },
    });
    if (!listing) {
      throw new NotFoundException(`Listing not found: ${id}`);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.listingView.create({
        data: {
          listingId: id,
          viewerId: input.viewerId ?? null,
          viewerFingerprint: input.fingerprint ?? null,
        },
      });
      return tx.listing.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
        select: { id: true, viewCount: true },
      });
    });

    return updated;
  }

  // ---------------------------------------------------------------------------
  // Owner
  // ---------------------------------------------------------------------------

  async listMine(
    ownerId: string,
    input: { status?: string; page?: number; pageSize?: number } = {},
  ) {
    const page = Math.max(input.page ?? 1, 1);
    const pageSize = Math.min(Math.max(input.pageSize ?? 20, 1), 100);
    const where: Prisma.ListingWhereInput = {
      ownerId,
      deletedAt: null,
      ...(input.status ? { status: input.status } : {}),
    };
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.listing.count({ where }),
      this.prisma.listing.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          media: {
            where: { status: 'ready' },
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
            take: 1,
          },
        },
      }),
    ]);
    return {
      page,
      pageSize,
      total,
      items: rows.map((row) => this.toOwnerSummary(row)),
    };
  }

  async getMine(ownerId: string, id: string) {
    const listing = await this.requireOwned(ownerId, id);
    return this.toDetail(listing);
  }

  async create(ownerId: string, dto: CreateListingDto) {
    await this.assertOwnerActive(ownerId);
    const category = await this.assertCategory(dto.categoryId);
    await this.assertCountryCurrencyCity(dto);

    const listingType = dto.listingType ?? category.listingType;
    const attributes = dto.attributes ?? [];
    if (attributes.length > 0) {
      await this.validateAttributes(dto.categoryId, attributes, { requireRequired: false });
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const listing = await tx.listing.create({
        data: {
          ownerId,
          categoryId: dto.categoryId,
          countryId: dto.countryId,
          cityId: dto.cityId ?? null,
          listingType,
          title: dto.title.trim(),
          description: dto.description.trim(),
          priceAmount:
            dto.priceAmount === undefined || dto.priceAmount === null
              ? null
              : new Prisma.Decimal(dto.priceAmount),
          currencyCode: dto.currencyCode?.toUpperCase() ?? null,
          latitude: dto.latitude ?? null,
          longitude: dto.longitude ?? null,
          status: 'draft',
        },
      });

      await tx.listingStatusHistory.create({
        data: {
          listingId: listing.id,
          fromStatus: null,
          toStatus: 'draft',
          actorId: ownerId,
          reason: 'created',
        },
      });

      if (attributes.length > 0) {
        await this.replaceAttributesTx(tx, listing.id, attributes);
      }

      return tx.listing.findUniqueOrThrow({
        where: { id: listing.id },
        include: listingInclude,
      });
    });

    if (dto.submitForReview) {
      return this.submitForReview(ownerId, created.id);
    }

    return this.toDetail(created);
  }

  async update(ownerId: string, id: string, dto: UpdateListingDto) {
    const existing = await this.requireOwned(ownerId, id);
    if (!EDITABLE_STATUSES.includes(existing.status as ListingStatus)) {
      throw new BadRequestException(
        `Listing in status ${existing.status} cannot be edited; revise to draft first`,
      );
    }

    const categoryId = dto.categoryId ?? existing.categoryId;
    if (dto.categoryId) {
      await this.assertCategory(dto.categoryId);
    }
    await this.assertCountryCurrencyCity({
      countryId: dto.countryId ?? existing.countryId,
      cityId: dto.cityId === undefined ? existing.cityId : dto.cityId,
      currencyCode: dto.currencyCode === undefined ? existing.currencyCode : dto.currencyCode,
      priceAmount:
        dto.priceAmount === undefined
          ? existing.priceAmount
            ? Number(existing.priceAmount)
            : null
          : dto.priceAmount,
    });

    if (dto.attributes) {
      await this.validateAttributes(categoryId, dto.attributes, { requireRequired: false });
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.listing.update({
        where: { id },
        data: {
          ...(dto.categoryId !== undefined ? { categoryId: dto.categoryId } : {}),
          ...(dto.countryId !== undefined ? { countryId: dto.countryId } : {}),
          ...(dto.cityId !== undefined ? { cityId: dto.cityId } : {}),
          ...(dto.listingType !== undefined ? { listingType: dto.listingType } : {}),
          ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
          ...(dto.description !== undefined ? { description: dto.description.trim() } : {}),
          ...(dto.priceAmount !== undefined
            ? {
                priceAmount: dto.priceAmount === null ? null : new Prisma.Decimal(dto.priceAmount),
              }
            : {}),
          ...(dto.currencyCode !== undefined
            ? { currencyCode: dto.currencyCode?.toUpperCase() ?? null }
            : {}),
          ...(dto.latitude !== undefined ? { latitude: dto.latitude } : {}),
          ...(dto.longitude !== undefined ? { longitude: dto.longitude } : {}),
          rejectionReason: existing.status === 'rejected' ? null : existing.rejectionReason,
        },
      });

      if (dto.attributes) {
        await this.replaceAttributesTx(tx, id, dto.attributes);
      }

      return tx.listing.findUniqueOrThrow({ where: { id }, include: listingInclude });
    });

    return this.toDetail(updated);
  }

  async submitForReview(ownerId: string, id: string) {
    const listing = await this.requireOwned(ownerId, id);
    if (listing.status !== 'draft' && listing.status !== 'rejected') {
      throw new BadRequestException(`Cannot submit listing in status ${listing.status}`);
    }

    // Rejected → draft first per state machine, then pending_review.
    if (listing.status === 'rejected') {
      await this.transition(listing.id, 'draft', ownerId, 'revise before resubmit');
    }

    await this.assertPublishReady(listing.id);

    const autoApprove = await this.isAutoApproveEnabled();
    const target: ListingStatus = autoApprove ? 'active' : 'pending_review';
    const after = await this.transition(
      listing.id,
      target,
      ownerId,
      autoApprove ? 'auto-approved on submit' : 'submitted for review',
    );

    if (autoApprove) {
      await this.audit.record({
        actorId: ownerId,
        action: 'listing.auto_approve',
        entityType: 'listing',
        entityId: id,
        after,
      });
    }

    return this.toDetail(
      await this.prisma.listing.findUniqueOrThrow({ where: { id }, include: listingInclude }),
    );
  }

  async withdraw(ownerId: string, id: string) {
    const listing = await this.requireOwned(ownerId, id);
    if (listing.status !== 'pending_review') {
      throw new BadRequestException('Only pending_review listings can be withdrawn');
    }
    await this.transition(id, 'draft', ownerId, 'withdrawn by owner');
    return this.getMine(ownerId, id);
  }

  async pause(ownerId: string, id: string) {
    await this.requireOwned(ownerId, id);
    await this.transition(id, 'paused', ownerId, 'paused by owner');
    return this.getMine(ownerId, id);
  }

  async resume(ownerId: string, id: string) {
    await this.requireOwned(ownerId, id);
    await this.transition(id, 'active', ownerId, 'resumed by owner');
    return this.getMine(ownerId, id);
  }

  async softDelete(ownerId: string, id: string) {
    const listing = await this.requireOwned(ownerId, id);
    const from = listing.status as ListingStatus;
    if (!LISTING_STATUS_TRANSITIONS[from].includes('deleted')) {
      throw new BadRequestException(`Cannot delete listing in status ${from}`);
    }
    await this.transition(id, 'deleted', ownerId, 'soft-deleted by owner');
    return { id, status: 'deleted' as const };
  }

  async uploadMedia(
    ownerId: string,
    listingId: string,
    file: { buffer: Buffer; mimetype: string; originalname: string; size: number },
    sortOrder?: number,
  ) {
    const listing = await this.requireOwned(ownerId, listingId);
    if (!EDITABLE_STATUSES.includes(listing.status as ListingStatus)) {
      throw new BadRequestException('Media can only be uploaded while draft/rejected');
    }
    if (!file?.buffer?.length) {
      throw new BadRequestException('Empty file');
    }
    if (file.size > 8 * 1024 * 1024) {
      throw new BadRequestException('File too large (max 8MB)');
    }
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.mimetype)) {
      throw new BadRequestException(`Unsupported mime type: ${file.mimetype}`);
    }

    const ext = file.originalname.includes('.')
      ? file.originalname.split('.').pop()?.toLowerCase()
      : 'bin';
    const key = `listings/${listingId}/${contentHash(file.buffer)}-${randomUUID().slice(0, 8)}.${ext ?? 'bin'}`;
    const stored = await this.storage.putObject({
      key,
      body: file.buffer,
      mimeType: file.mimetype,
    });

    const mediaCount = await this.prisma.listingMedia.count({
      where: { listingId, status: 'ready' },
    });

    const media = await this.prisma.listingMedia.create({
      data: {
        listingId,
        storageKey: stored.storageKey,
        cdnUrl: stored.publicUrl,
        mimeType: stored.mimeType,
        byteSize: stored.byteSize,
        sortOrder: sortOrder ?? mediaCount,
        status: 'ready',
      },
    });

    // Metadata only — no binary in Postgres.
    return {
      id: media.id,
      listingId: media.listingId,
      storageKey: media.storageKey,
      cdnUrl: media.cdnUrl,
      mimeType: media.mimeType,
      byteSize: media.byteSize,
      sortOrder: media.sortOrder,
      status: media.status,
      createdAt: media.createdAt,
    };
  }

  async deleteMedia(ownerId: string, listingId: string, mediaId: string) {
    const listing = await this.requireOwned(ownerId, listingId);
    if (!EDITABLE_STATUSES.includes(listing.status as ListingStatus)) {
      throw new BadRequestException('Media can only be deleted while draft/rejected');
    }
    const media = await this.prisma.listingMedia.findFirst({
      where: { id: mediaId, listingId },
    });
    if (!media) {
      throw new NotFoundException('Media not found');
    }
    await this.storage.deleteObject(media.storageKey);
    await this.prisma.listingMedia.update({
      where: { id: mediaId },
      data: { status: 'deleted' },
    });
    return { id: mediaId, status: 'deleted' as const };
  }

  // ---------------------------------------------------------------------------
  // Moderation / admin
  // ---------------------------------------------------------------------------

  async listPending(input: { page?: number; pageSize?: number } = {}) {
    const page = Math.max(input.page ?? 1, 1);
    const pageSize = Math.min(Math.max(input.pageSize ?? 20, 1), 100);
    const where: Prisma.ListingWhereInput = {
      status: 'pending_review',
      deletedAt: null,
    };
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.listing.count({ where }),
      this.prisma.listing.findMany({
        where,
        orderBy: { updatedAt: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          media: {
            where: { status: 'ready' },
            orderBy: [{ sortOrder: 'asc' }],
            take: 1,
          },
          owner: { select: { id: true, email: true, displayName: true } },
        },
      }),
    ]);
    return {
      page,
      pageSize,
      total,
      items: rows.map((row) => ({
        ...this.toOwnerSummary(row),
        owner: row.owner,
      })),
    };
  }

  async approve(actorId: string, id: string, reason?: string) {
    const listing = await this.requireExisting(id);
    if (listing.status !== 'pending_review') {
      throw new BadRequestException('Only pending_review listings can be approved');
    }
    await this.assertPublishReady(id);
    const after = await this.transition(id, 'active', actorId, reason ?? 'approved');
    await this.audit.record({
      actorId,
      action: 'listing.approve',
      entityType: 'listing',
      entityId: id,
      before: { status: 'pending_review' },
      after,
      metadata: reason ? { reason } : undefined,
    });
    return this.toDetail(
      await this.prisma.listing.findUniqueOrThrow({ where: { id }, include: listingInclude }),
    );
  }

  async reject(actorId: string, id: string, reason?: string) {
    const listing = await this.requireExisting(id);
    if (listing.status !== 'pending_review') {
      throw new BadRequestException('Only pending_review listings can be rejected');
    }
    if (!reason?.trim()) {
      throw new BadRequestException('Rejection reason is required');
    }
    await this.prisma.listing.update({
      where: { id },
      data: { rejectionReason: reason.trim() },
    });
    const after = await this.transition(id, 'rejected', actorId, reason.trim());
    await this.audit.record({
      actorId,
      action: 'listing.reject',
      entityType: 'listing',
      entityId: id,
      before: { status: 'pending_review' },
      after,
      metadata: { reason: reason.trim() },
    });
    return this.toDetail(
      await this.prisma.listing.findUniqueOrThrow({ where: { id }, include: listingInclude }),
    );
  }

  async adminGet(id: string) {
    const listing = await this.requireExisting(id);
    return this.toDetail(listing);
  }

  // ---------------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------------

  private async transition(
    listingId: string,
    toStatus: ListingStatus,
    actorId: string | null,
    reason?: string,
  ) {
    const listing = await this.prisma.listing.findUniqueOrThrow({ where: { id: listingId } });
    const from = listing.status as ListingStatus;
    const allowed = LISTING_STATUS_TRANSITIONS[from] ?? [];
    if (!allowed.includes(toStatus)) {
      throw new BadRequestException(`Illegal status transition ${from} → ${toStatus}`);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.listing.update({
        where: { id: listingId },
        data: {
          status: toStatus,
          ...(toStatus === 'active'
            ? { publishedAt: listing.publishedAt ?? new Date(), rejectionReason: null }
            : {}),
          ...(toStatus === 'deleted' ? { deletedAt: new Date() } : {}),
        },
      });
      await tx.listingStatusHistory.create({
        data: {
          listingId,
          fromStatus: from,
          toStatus,
          actorId,
          reason: reason ?? null,
        },
      });
      return row;
    });

    return {
      id: updated.id,
      status: updated.status,
      publishedAt: updated.publishedAt,
    };
  }

  private async assertPublishReady(listingId: string) {
    const listing = await this.prisma.listing.findUniqueOrThrow({
      where: { id: listingId },
      include: {
        media: { where: { status: 'ready' } },
        attributeValues: true,
      },
    });

    if (!listing.title?.trim() || listing.description.trim().length < 10) {
      throw new BadRequestException('Title and description are required to publish');
    }
    if (listing.priceAmount == null || !listing.currencyCode) {
      throw new BadRequestException('Price and currency are required to publish');
    }
    if (listing.media.length < 1) {
      throw new BadRequestException('At least one media item is required to publish');
    }

    const attrs = listing.attributeValues.map((v) => ({
      attributeDefinitionId: v.attributeDefinitionId,
      valueText: v.valueText ?? undefined,
      valueNumber: v.valueNumber != null ? Number(v.valueNumber) : undefined,
      valueBool: v.valueBool ?? undefined,
      valueDate: v.valueDate ? v.valueDate.toISOString().slice(0, 10) : undefined,
      valueJson: v.valueJson ?? undefined,
    }));
    await this.validateAttributes(listing.categoryId, attrs, { requireRequired: true });
  }

  private async validateAttributes(
    categoryId: string,
    inputs: ListingAttributeInputDto[],
    opts: { requireRequired: boolean },
  ) {
    const schema = await this.catalog.listCategoryAttributesPublic(categoryId);
    const byId = new Map(schema.map((a) => [a.attributeDefinitionId, a]));
    const seen = new Set<string>();

    for (const input of inputs) {
      if (seen.has(input.attributeDefinitionId)) {
        throw new BadRequestException(
          `Duplicate attribute value for ${input.attributeDefinitionId}`,
        );
      }
      seen.add(input.attributeDefinitionId);
      const def = byId.get(input.attributeDefinitionId);
      if (!def) {
        throw new BadRequestException(
          `Attribute ${input.attributeDefinitionId} is not attached to this category`,
        );
      }
      this.assertAttributeValue(def, input);
    }

    if (opts.requireRequired) {
      for (const def of schema) {
        if (!def.isRequired) continue;
        if (!seen.has(def.attributeDefinitionId)) {
          throw new BadRequestException(`Missing required attribute: ${def.code}`);
        }
      }
    }
  }

  private assertAttributeValue(
    def: {
      code: string;
      dataType: string;
      validationJson: unknown;
      options: Array<{ value: string }>;
    },
    input: ListingAttributeInputDto,
  ) {
    const optionValues = new Set(def.options.map((o) => o.value));
    const validation =
      def.validationJson && typeof def.validationJson === 'object'
        ? (def.validationJson as Record<string, unknown>)
        : {};

    switch (def.dataType) {
      case 'text':
      case 'unit':
        if (!input.valueText?.trim()) {
          throw new BadRequestException(`Attribute ${def.code} requires valueText`);
        }
        break;
      case 'number':
      case 'int':
      case 'decimal': {
        if (input.valueNumber === undefined || input.valueNumber === null) {
          throw new BadRequestException(`Attribute ${def.code} requires valueNumber`);
        }
        if (def.dataType === 'int' && !Number.isInteger(input.valueNumber)) {
          throw new BadRequestException(`Attribute ${def.code} must be an integer`);
        }
        if (typeof validation.min === 'number' && input.valueNumber < validation.min) {
          throw new BadRequestException(`Attribute ${def.code} below min ${validation.min}`);
        }
        if (typeof validation.max === 'number' && input.valueNumber > validation.max) {
          throw new BadRequestException(`Attribute ${def.code} above max ${validation.max}`);
        }
        break;
      }
      case 'bool':
        if (typeof input.valueBool !== 'boolean') {
          throw new BadRequestException(`Attribute ${def.code} requires valueBool`);
        }
        break;
      case 'date':
        if (!input.valueDate || Number.isNaN(Date.parse(input.valueDate))) {
          throw new BadRequestException(`Attribute ${def.code} requires valid valueDate`);
        }
        break;
      case 'single_select':
        if (!input.valueText || !optionValues.has(input.valueText)) {
          throw new BadRequestException(`Attribute ${def.code} requires a valid option value`);
        }
        break;
      case 'multi_select': {
        const values = Array.isArray(input.valueJson) ? input.valueJson : null;
        if (!values || values.length === 0 || !values.every((v) => typeof v === 'string')) {
          throw new BadRequestException(`Attribute ${def.code} requires valueJson string[]`);
        }
        for (const v of values) {
          if (!optionValues.has(v)) {
            throw new BadRequestException(`Invalid option ${v} for ${def.code}`);
          }
        }
        break;
      }
      case 'numeric_range': {
        const range =
          input.valueJson && typeof input.valueJson === 'object'
            ? (input.valueJson as { min?: number; max?: number })
            : null;
        if (!range || typeof range.min !== 'number' || typeof range.max !== 'number') {
          throw new BadRequestException(`Attribute ${def.code} requires valueJson {min,max}`);
        }
        if (range.min > range.max) {
          throw new BadRequestException(`Attribute ${def.code} min cannot exceed max`);
        }
        break;
      }
      default:
        throw new BadRequestException(`Unsupported attribute data type: ${def.dataType}`);
    }
  }

  private async replaceAttributesTx(
    tx: Prisma.TransactionClient,
    listingId: string,
    inputs: ListingAttributeInputDto[],
  ) {
    await tx.listingAttributeValue.deleteMany({ where: { listingId } });
    for (const input of inputs) {
      await tx.listingAttributeValue.create({
        data: {
          listingId,
          attributeDefinitionId: input.attributeDefinitionId,
          valueText: input.valueText ?? null,
          valueNumber:
            input.valueNumber === undefined || input.valueNumber === null
              ? null
              : new Prisma.Decimal(input.valueNumber),
          valueBool: input.valueBool ?? null,
          valueDate: input.valueDate ? new Date(input.valueDate) : null,
          valueJson:
            input.valueJson === undefined ? undefined : (input.valueJson as Prisma.InputJsonValue),
        },
      });
    }
  }

  private async assertOwnerActive(ownerId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: ownerId, deletedAt: null, status: 'active' },
    });
    if (!user) {
      throw new ForbiddenException('Owner account is not active');
    }
  }

  private async assertCategory(categoryId: string) {
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, deletedAt: null, isActive: true },
    });
    if (!category) {
      throw new BadRequestException(`Invalid category: ${categoryId}`);
    }
    return category;
  }

  private async assertCountryCurrencyCity(input: {
    countryId: string;
    cityId?: string | null;
    currencyCode?: string | null;
    priceAmount?: number | null;
  }) {
    const country = await this.prisma.country.findFirst({
      where: { id: input.countryId, isActive: true },
    });
    if (!country) {
      throw new BadRequestException(`Invalid country: ${input.countryId}`);
    }

    if (input.cityId) {
      const city = await this.prisma.city.findFirst({
        where: { id: input.cityId, isActive: true },
        include: { region: true },
      });
      if (!city || city.region.countryId !== input.countryId) {
        throw new BadRequestException('City does not belong to the selected country');
      }
    }

    if (input.currencyCode) {
      const code = input.currencyCode.toUpperCase();
      const currency = await this.prisma.currency.findFirst({
        where: { code, isActive: true },
      });
      if (!currency) {
        throw new BadRequestException(`Unknown currency: ${code}`);
      }
      const allowed = await this.prisma.countryCurrency.findFirst({
        where: { countryId: input.countryId, currencyId: currency.id },
      });
      if (!allowed) {
        throw new BadRequestException(`Currency ${code} is not allowed for this country`);
      }
    }
  }

  private async isAutoApproveEnabled(): Promise<boolean> {
    const setting = await this.prisma.businessSetting.findUnique({
      where: { key: 'listings.moderation.auto_approve' },
    });
    const value = setting?.valueJson;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return Boolean((value as { enabled?: boolean }).enabled);
    }
    return false;
  }

  private async requireOwned(ownerId: string, id: string) {
    const listing = await this.prisma.listing.findFirst({
      where: { id, ownerId, deletedAt: null },
      include: listingInclude,
    });
    if (!listing) {
      throw new NotFoundException(`Listing not found: ${id}`);
    }
    return listing;
  }

  private async requireExisting(id: string) {
    const listing = await this.prisma.listing.findFirst({
      where: { id, deletedAt: null },
      include: listingInclude,
    });
    if (!listing) {
      throw new NotFoundException(`Listing not found: ${id}`);
    }
    return listing;
  }

  private toPublicSummary(row: {
    id: string;
    title: string;
    priceAmount: Prisma.Decimal | null;
    currencyCode: string | null;
    status: string;
    viewCount: number;
    publishedAt: Date | null;
    categoryId: string;
    countryId: string;
    listingType: string;
    media?: Array<{ cdnUrl: string }>;
  }) {
    return {
      id: row.id,
      title: row.title,
      priceAmount: row.priceAmount != null ? Number(row.priceAmount) : null,
      currencyCode: row.currencyCode,
      status: row.status,
      viewCount: row.viewCount,
      publishedAt: row.publishedAt,
      categoryId: row.categoryId,
      countryId: row.countryId,
      listingType: row.listingType,
      coverImageUrl: row.media?.[0]?.cdnUrl ?? null,
    };
  }

  private toOwnerSummary(
    row: Parameters<ListingsService['toPublicSummary']>[0] & {
      description?: string;
      rejectionReason?: string | null;
      updatedAt?: Date;
    },
  ) {
    return {
      ...this.toPublicSummary(row),
      rejectionReason: row.rejectionReason ?? null,
      updatedAt: row.updatedAt ?? null,
    };
  }

  private toDetail(row: Awaited<ReturnType<ListingsService['requireOwned']>>) {
    return {
      id: row.id,
      ownerId: row.ownerId,
      categoryId: row.categoryId,
      countryId: row.countryId,
      cityId: row.cityId,
      listingType: row.listingType,
      title: row.title,
      description: row.description,
      priceAmount: row.priceAmount != null ? Number(row.priceAmount) : null,
      currencyCode: row.currencyCode,
      status: row.status,
      isFeaturedCached: row.isFeaturedCached,
      viewCount: row.viewCount,
      latitude: row.latitude,
      longitude: row.longitude,
      publishedAt: row.publishedAt,
      expiresAt: row.expiresAt,
      rejectionReason: row.rejectionReason,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      media: row.media
        .filter((m) => m.status !== 'deleted')
        .map((m) => ({
          id: m.id,
          storageKey: m.storageKey,
          cdnUrl: m.cdnUrl,
          mimeType: m.mimeType,
          byteSize: m.byteSize,
          sortOrder: m.sortOrder,
          status: m.status,
        })),
      attributes: row.attributeValues.map((v) => ({
        id: v.id,
        attributeDefinitionId: v.attributeDefinitionId,
        code: v.attributeDefinition.code,
        dataType: v.attributeDefinition.dataType,
        valueText: v.valueText,
        valueNumber: v.valueNumber != null ? Number(v.valueNumber) : null,
        valueBool: v.valueBool,
        valueDate: v.valueDate,
        valueJson: v.valueJson,
      })),
    };
  }
}
