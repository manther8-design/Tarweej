import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import type {
  SearchAttributeFilter,
  SearchEngine,
  SearchListingsQuery,
  SearchListingsResult,
  SearchSort,
} from '../../domain/search.types';

type ListingRow = {
  id: string;
  title: string;
  price_amount: Prisma.Decimal | null;
  currency_code: string | null;
  status: string;
  view_count: number;
  published_at: Date | null;
  category_id: string;
  country_id: string;
  city_id: string | null;
  listing_type: string;
  is_featured_cached: boolean;
  cover_url: string | null;
};

@Injectable()
export class PostgresSearchEngine implements SearchEngine {
  constructor(private readonly prisma: PrismaService) {}

  async searchListings(query: SearchListingsQuery): Promise<SearchListingsResult> {
    const page = Math.max(query.page ?? 1, 1);
    const pageSize = Math.min(Math.max(query.pageSize ?? 20, 1), 100);
    const sort: SearchSort = query.sort ?? 'newest';
    const status = query.status ?? 'active';
    const attributes = query.attributes ?? [];

    const filterParams: unknown[] = [];
    const pushFilter = (value: unknown): string => {
      filterParams.push(value);
      return `$${filterParams.length}`;
    };

    const where: string[] = [`l.deleted_at IS NULL`, `l.status = ${pushFilter(status)}`];

    if (query.categoryId) {
      where.push(`l.category_id = ${pushFilter(query.categoryId)}::uuid`);
    }
    if (query.countryId) {
      where.push(`l.country_id = ${pushFilter(query.countryId)}::uuid`);
    }
    if (query.cityId) {
      where.push(`l.city_id = ${pushFilter(query.cityId)}::uuid`);
    }
    if (query.minPrice != null) {
      where.push(`l.price_amount >= ${pushFilter(query.minPrice)}`);
    }
    if (query.maxPrice != null) {
      where.push(`l.price_amount <= ${pushFilter(query.maxPrice)}`);
    }
    if (query.featured === true) {
      where.push(`l.is_featured_cached = true`);
    } else if (query.featured === false) {
      where.push(`l.is_featured_cached = false`);
    }

    const q = query.q?.trim();
    let rankSelect = '0::float8 AS rank';
    if (q) {
      const qParam = pushFilter(q);
      where.push(`(
        l.search_vector @@ plainto_tsquery('simple', ${qParam})
        OR l.title ILIKE ('%' || ${qParam} || '%')
        OR l.description ILIKE ('%' || ${qParam} || '%')
      )`);
      rankSelect = `ts_rank_cd(l.search_vector, plainto_tsquery('simple', ${qParam})) AS rank`;
    }

    for (const attr of attributes) {
      this.appendAttributeFilter(where, pushFilter, attr);
    }

    const orderBy = this.orderBySql(sort, Boolean(q));
    const whereSql = where.join(' AND ');
    const offset = (page - 1) * pageSize;

    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM listings l
      WHERE ${whereSql}
    `;

    const listParams = [...filterParams, pageSize, offset];
    const limitPlaceholder = `$${filterParams.length + 1}`;
    const offsetPlaceholder = `$${filterParams.length + 2}`;

    const listSql = `
      SELECT
        l.id,
        l.title,
        l.price_amount,
        l.currency_code,
        l.status,
        l.view_count,
        l.published_at,
        l.category_id,
        l.country_id,
        l.city_id,
        l.listing_type,
        l.is_featured_cached,
        (
          SELECT m.cdn_url
          FROM listing_media m
          WHERE m.listing_id = l.id AND m.status = 'ready'
          ORDER BY m.sort_order ASC, m.created_at ASC
          LIMIT 1
        ) AS cover_url,
        ${rankSelect}
      FROM listings l
      WHERE ${whereSql}
      ORDER BY ${orderBy}
      LIMIT ${limitPlaceholder}
      OFFSET ${offsetPlaceholder}
    `;

    const [totalResult, rows] = await Promise.all([
      this.prisma.$queryRawUnsafe<Array<{ total: number }>>(countSql, ...filterParams),
      this.prisma.$queryRawUnsafe<ListingRow[]>(listSql, ...listParams),
    ]);

    return {
      page,
      pageSize,
      total: totalResult[0]?.total ?? 0,
      items: rows.map((row) => ({
        id: row.id,
        title: row.title,
        priceAmount: row.price_amount != null ? Number(row.price_amount) : null,
        currencyCode: row.currency_code,
        status: row.status,
        viewCount: row.view_count,
        publishedAt: row.published_at,
        categoryId: row.category_id,
        countryId: row.country_id,
        cityId: row.city_id,
        listingType: row.listing_type,
        isFeaturedCached: row.is_featured_cached,
        coverImageUrl: row.cover_url,
      })),
    };
  }

  private appendAttributeFilter(
    where: string[],
    push: (value: unknown) => string,
    attr: SearchAttributeFilter,
  ): void {
    const attrId = push(attr.attributeDefinitionId);
    const conditions: string[] = [`av.attribute_definition_id = ${attrId}::uuid`];

    if (attr.eq != null && attr.eq !== '') {
      const eq = push(attr.eq);
      conditions.push(`(
        av.value_text = ${eq}
        OR (
          av.value_json IS NOT NULL
          AND jsonb_typeof(av.value_json) = 'array'
          AND av.value_json ? ${eq}
        )
      )`);
    }
    if (attr.min != null) {
      conditions.push(`av.value_number >= ${push(attr.min)}`);
    }
    if (attr.max != null) {
      conditions.push(`av.value_number <= ${push(attr.max)}`);
    }
    if (typeof attr.bool === 'boolean') {
      conditions.push(`av.value_bool = ${push(attr.bool)}`);
    }

    where.push(`EXISTS (
      SELECT 1 FROM listing_attribute_values av
      WHERE av.listing_id = l.id AND ${conditions.join(' AND ')}
    )`);
  }

  private orderBySql(sort: SearchSort, hasTextQuery: boolean): string {
    const rankFirst = hasTextQuery ? 'rank DESC NULLS LAST, ' : '';
    switch (sort) {
      case 'oldest':
        return `${rankFirst}l.published_at ASC NULLS LAST, l.created_at ASC`;
      case 'price_asc':
        return `${rankFirst}l.price_amount ASC NULLS LAST, l.published_at DESC NULLS LAST`;
      case 'price_desc':
        return `${rankFirst}l.price_amount DESC NULLS LAST, l.published_at DESC NULLS LAST`;
      case 'views':
        return `${rankFirst}l.view_count DESC, l.published_at DESC NULLS LAST`;
      case 'featured':
        return `${rankFirst}l.is_featured_cached DESC, l.published_at DESC NULLS LAST, l.created_at DESC`;
      case 'newest':
      default:
        return `${rankFirst}l.published_at DESC NULLS LAST, l.created_at DESC`;
    }
  }
}
