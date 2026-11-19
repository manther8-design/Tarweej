/** Sort options for listing search (TRW-008). */
export const SEARCH_SORT_OPTIONS = [
  'newest',
  'oldest',
  'price_asc',
  'price_desc',
  'views',
  'featured',
] as const;

export type SearchSort = (typeof SEARCH_SORT_OPTIONS)[number];

/** Dynamic attribute filter clause. */
export type SearchAttributeFilter = {
  attributeDefinitionId: string;
  /** Exact match on value_text / single_select / multi_select membership. */
  eq?: string;
  /** Numeric range lower bound (inclusive). */
  min?: number;
  /** Numeric range upper bound (inclusive). */
  max?: number;
  /** Boolean attribute match. */
  bool?: boolean;
};

export type SearchListingsQuery = {
  q?: string;
  categoryId?: string;
  cityId?: string;
  countryId?: string;
  minPrice?: number;
  maxPrice?: number;
  /** Defaults to active for the public API. */
  status?: string;
  featured?: boolean;
  sort?: SearchSort;
  page?: number;
  pageSize?: number;
  attributes?: SearchAttributeFilter[];
};

export type SearchListingHit = {
  id: string;
  title: string;
  priceAmount: number | null;
  currencyCode: string | null;
  status: string;
  viewCount: number;
  publishedAt: Date | null;
  categoryId: string;
  countryId: string;
  cityId: string | null;
  listingType: string;
  isFeaturedCached: boolean;
  coverImageUrl: string | null;
};

export type SearchListingsResult = {
  page: number;
  pageSize: number;
  total: number;
  items: SearchListingHit[];
  /** True when the response was served from Redis. */
  cached?: boolean;
};

export const SEARCH_ENGINE_PORT = Symbol('SEARCH_ENGINE_PORT');

export interface SearchEngine {
  searchListings(query: SearchListingsQuery): Promise<SearchListingsResult>;
}

export const SEARCH_CACHE_PORT = Symbol('SEARCH_CACHE_PORT');

export interface SearchCachePort {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
}
