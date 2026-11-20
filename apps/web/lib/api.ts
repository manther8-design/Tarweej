const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:3000/api/v1';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function parseError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { message?: string | string[] };
    if (Array.isArray(body.message)) {
      return body.message.join(', ');
    }
    return body.message || res.statusText || 'Request failed';
  } catch {
    return res.statusText || 'Request failed';
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token, headers, ...rest } = options;
  const res = await fetch(`${API_BASE}${path.startsWith('/') ? path : `/${path}`}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    next: { revalidate: 30 },
  });

  if (!res.ok) {
    throw new ApiError(await parseError(res), res.status);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

export type ListingHit = {
  id: string;
  title: string;
  priceAmount?: number | null;
  currencyCode?: string | null;
  coverImageUrl?: string | null;
  isFeaturedCached?: boolean;
  cityId?: string | null;
  categoryId?: string | null;
  status?: string;
  viewCount?: number;
};

export type SearchPage = {
  items: ListingHit[];
  page: number;
  pageSize: number;
  total: number;
  cached?: boolean;
};

export type CategoryNode = {
  id: string;
  name: string;
  slug: string;
  children?: CategoryNode[];
};

export type ListingDetail = {
  id: string;
  title: string;
  description: string;
  priceAmount?: number | null;
  currencyCode?: string | null;
  status: string;
  viewCount: number;
  isFeaturedCached?: boolean;
  categoryId: string;
  countryId: string;
  cityId?: string | null;
  owner?: { id: string; displayName?: string | null } | null;
  media?: Array<{ id: string; cdnUrl: string }>;
  attributes?: Array<{
    code: string;
    valueText?: string | null;
    valueNumber?: number | null;
    valueBool?: boolean | null;
  }>;
};

export async function searchListings(params: Record<string, string | number | undefined> = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      query.set(key, String(value));
    }
  }
  const qs = query.toString();
  return apiFetch<SearchPage>(`/search/listings${qs ? `?${qs}` : ''}`);
}

export async function listCategories(lang = 'ar') {
  return apiFetch<CategoryNode[]>(`/categories?lang=${encodeURIComponent(lang)}`);
}

export async function getListing(id: string) {
  return apiFetch<ListingDetail>(`/listings/${id}`);
}

export function formatPrice(amount?: number | null, currency?: string | null) {
  if (amount == null) {
    return 'Price on request';
  }
  const rounded = Number.isInteger(amount) ? amount.toFixed(0) : amount.toFixed(2);
  return `${rounded} ${currency ?? ''}`.trim();
}
