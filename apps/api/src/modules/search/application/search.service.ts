import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import type {
  SearchAttributeFilter,
  SearchCachePort,
  SearchEngine,
  SearchListingsQuery,
  SearchListingsResult,
} from '../domain/search.types';
import { SEARCH_CACHE_PORT, SEARCH_ENGINE_PORT } from '../domain/search.types';

const CACHE_TTL_SECONDS = 45;

@Injectable()
export class SearchService {
  constructor(
    @Inject(SEARCH_ENGINE_PORT) private readonly engine: SearchEngine,
    @Inject(SEARCH_CACHE_PORT) private readonly cache: SearchCachePort,
  ) {}

  async searchListings(
    query: SearchListingsQuery & { attrsJson?: string },
  ): Promise<SearchListingsResult> {
    const attributes = this.parseAttributes(query.attrsJson);
    const normalized: SearchListingsQuery = {
      ...query,
      status: query.status ?? 'active',
      sort: query.sort ?? 'newest',
      attributes,
    };

    const cacheKey = this.cacheKey(normalized);
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as SearchListingsResult;
        return { ...parsed, cached: true };
      } catch {
        // ignore corrupt cache entries
      }
    }

    const result = await this.engine.searchListings(normalized);
    const payload: SearchListingsResult = { ...result, cached: false };
    await this.cache.set(cacheKey, JSON.stringify(payload), CACHE_TTL_SECONDS);
    return payload;
  }

  private parseAttributes(attrsJson?: string): SearchAttributeFilter[] {
    if (!attrsJson?.trim()) return [];
    let parsed: unknown;
    try {
      parsed = JSON.parse(attrsJson);
    } catch {
      throw new BadRequestException('attrs must be a JSON array of attribute filters');
    }
    if (!Array.isArray(parsed)) {
      throw new BadRequestException('attrs must be a JSON array');
    }
    if (parsed.length > 30) {
      throw new BadRequestException('Too many attribute filters (max 30)');
    }

    const out: SearchAttributeFilter[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== 'object') {
        throw new BadRequestException('Invalid attribute filter entry');
      }
      const row = item as Record<string, unknown>;
      const id = row.attributeDefinitionId;
      if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id)) {
        throw new BadRequestException('attributeDefinitionId must be a UUID');
      }
      const filter: SearchAttributeFilter = { attributeDefinitionId: id };
      if (row.eq !== undefined) {
        if (typeof row.eq !== 'string') {
          throw new BadRequestException('attr.eq must be a string');
        }
        filter.eq = row.eq;
      }
      if (row.min !== undefined) {
        if (typeof row.min !== 'number' || Number.isNaN(row.min)) {
          throw new BadRequestException('attr.min must be a number');
        }
        filter.min = row.min;
      }
      if (row.max !== undefined) {
        if (typeof row.max !== 'number' || Number.isNaN(row.max)) {
          throw new BadRequestException('attr.max must be a number');
        }
        filter.max = row.max;
      }
      if (row.bool !== undefined) {
        if (typeof row.bool !== 'boolean') {
          throw new BadRequestException('attr.bool must be a boolean');
        }
        filter.bool = row.bool;
      }
      if (
        filter.eq === undefined &&
        filter.min === undefined &&
        filter.max === undefined &&
        filter.bool === undefined
      ) {
        throw new BadRequestException('Attribute filter needs eq, min/max, or bool');
      }
      out.push(filter);
    }
    return out;
  }

  private cacheKey(query: SearchListingsQuery): string {
    const stable = JSON.stringify({
      q: query.q ?? null,
      categoryId: query.categoryId ?? null,
      cityId: query.cityId ?? null,
      countryId: query.countryId ?? null,
      minPrice: query.minPrice ?? null,
      maxPrice: query.maxPrice ?? null,
      status: query.status ?? 'active',
      featured: query.featured ?? null,
      sort: query.sort ?? 'newest',
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 20,
      attributes: query.attributes ?? [],
    });
    const hash = createHash('sha256').update(stable).digest('hex').slice(0, 32);
    return `search:listings:${hash}`;
  }
}
