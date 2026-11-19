import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import type { FavoriteAvailability } from '../domain/engagement.types';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async add(userId: string, listingId: string) {
    const listing = await this.prisma.listing.findFirst({
      where: { id: listingId },
      select: { id: true, ownerId: true, status: true, deletedAt: true, title: true },
    });
    if (!listing || listing.deletedAt) {
      throw new NotFoundException(`Listing not found: ${listingId}`);
    }
    if (listing.ownerId === userId) {
      throw new ForbiddenException('Cannot favorite your own listing');
    }
    if (listing.status === 'deleted') {
      throw new NotFoundException(`Listing not found: ${listingId}`);
    }

    try {
      const favorite = await this.prisma.favorite.create({
        data: { userId, listingId },
      });
      return {
        id: favorite.id,
        listingId: favorite.listingId,
        createdAt: favorite.createdAt.toISOString(),
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Listing already favorited');
      }
      throw error;
    }
  }

  async remove(userId: string, listingId: string) {
    const existing = await this.prisma.favorite.findUnique({
      where: { userId_listingId: { userId, listingId } },
    });
    if (!existing) {
      throw new NotFoundException('Favorite not found');
    }
    await this.prisma.favorite.delete({ where: { id: existing.id } });
    return { removed: true, listingId };
  }

  async list(userId: string, input: { page?: number; pageSize?: number } = {}) {
    const page = Math.max(input.page ?? 1, 1);
    const pageSize = Math.min(Math.max(input.pageSize ?? 20, 1), 100);

    const where: Prisma.FavoriteWhereInput = { userId };
    const [total, rows] = await this.prisma.$transaction([
      this.prisma.favorite.count({ where }),
      this.prisma.favorite.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          listing: {
            include: {
              media: {
                where: { status: 'ready' },
                orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
                take: 1,
              },
            },
          },
        },
      }),
    ]);

    return {
      page,
      pageSize,
      total,
      items: rows.map((row) => {
        const listing = row.listing;
        const availability = this.resolveAvailability(listing);
        return {
          id: row.id,
          listingId: row.listingId,
          createdAt: row.createdAt.toISOString(),
          availability,
          listing:
            listing == null
              ? null
              : {
                  id: listing.id,
                  title: listing.title,
                  status: listing.status,
                  priceAmount: listing.priceAmount == null ? null : Number(listing.priceAmount),
                  currencyCode: listing.currencyCode,
                  deletedAt: listing.deletedAt?.toISOString() ?? null,
                  thumbnailUrl: listing.media[0]?.cdnUrl ?? null,
                },
        };
      }),
    };
  }

  async isFavorited(userId: string, listingId: string): Promise<boolean> {
    const row = await this.prisma.favorite.findUnique({
      where: { userId_listingId: { userId, listingId } },
      select: { id: true },
    });
    return Boolean(row);
  }

  private resolveAvailability(
    listing: {
      status: string;
      deletedAt: Date | null;
    } | null,
  ): FavoriteAvailability {
    if (!listing || listing.deletedAt || listing.status === 'deleted') {
      return 'deleted';
    }
    if (listing.status === 'expired') {
      return 'expired';
    }
    if (listing.status === 'active') {
      return 'available';
    }
    return 'unavailable';
  }
}
