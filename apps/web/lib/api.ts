const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ||
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ||
  'http://localhost:3000/api/v1';

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  accessExpiresIn: number;
  refreshExpiresIn: number;
  tokenType: 'Bearer';
};

export type AuthUser = {
  id: string;
  email: string | null;
  displayName: string | null;
  roles: string[];
  permissions: string[];
};

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
  options: RequestInit & { token?: string | null; cacheSeconds?: number } = {},
): Promise<T> {
  const { token, headers, cacheSeconds, ...rest } = options;
  const init: RequestInit = {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  };

  // Next.js server fetch cache hint — ignored in the browser.
  if (typeof window === 'undefined' && cacheSeconds !== undefined) {
    (init as RequestInit & { next?: { revalidate: number } }).next = {
      revalidate: cacheSeconds,
    };
  }

  const res = await fetch(`${API_BASE}${path.startsWith('/') ? path : `/${path}`}`, init);

  if (!res.ok) {
    throw new ApiError(await parseError(res), res.status);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

export function login(email: string, password: string) {
  return apiFetch<{ user: AuthUser; tokens: AuthTokens }>('/identity/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, deviceLabel: 'tarweej-web' }),
  });
}

export function logout(token: string) {
  return apiFetch<{ revoked: boolean }>('/identity/auth/logout', {
    method: 'POST',
    token,
  });
}

export function fetchMe(token: string) {
  return apiFetch<AuthUser>('/identity/me', { token });
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

export type OwnerListing = {
  id: string;
  title: string;
  priceAmount?: number | null;
  currencyCode?: string | null;
  status: string;
  viewCount: number;
  publishedAt?: string | null;
  categoryId: string;
  countryId: string;
  listingType: string;
  coverImageUrl?: string | null;
  rejectionReason?: string | null;
  updatedAt?: string | null;
};

export type MyListingsPage = {
  items: OwnerListing[];
  page: number;
  pageSize: number;
  total: number;
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
  return apiFetch<SearchPage>(`/search/listings${qs ? `?${qs}` : ''}`, { cacheSeconds: 30 });
}

export async function listCategories(lang = 'ar') {
  return apiFetch<CategoryNode[]>(`/categories?lang=${encodeURIComponent(lang)}`, {
    cacheSeconds: 30,
  });
}

export async function getListing(id: string) {
  return apiFetch<ListingDetail>(`/listings/${id}`, { cacheSeconds: 30 });
}

export function listMyListings(
  token: string,
  params: { status?: string; page?: number; pageSize?: number } = {},
) {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));
  const qs = query.toString();
  return apiFetch<MyListingsPage>(`/my/listings${qs ? `?${qs}` : ''}`, { token });
}

export type FavoriteListing = {
  id: string;
  title: string;
  status: string;
  priceAmount?: number | null;
  currencyCode?: string | null;
  thumbnailUrl?: string | null;
};

export function listFavorites(token: string, page = 1, pageSize = 20) {
  const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  return apiFetch<{
    items: Array<{ listingId: string; listing: FavoriteListing | null }>;
    total: number;
  }>(`/favorites?${query}`, { token });
}

export function formatPrice(amount?: number | null, currency?: string | null) {
  if (amount == null) {
    return 'السعر عند الطلب';
  }
  const rounded = Number.isInteger(amount) ? amount.toFixed(0) : amount.toFixed(2);
  return `${rounded} ${currency ?? ''}`.trim();
}

export function statusLabelAr(status: string): string {
  switch (status) {
    case 'draft':
      return 'مسودة';
    case 'pending_review':
      return 'قيد المراجعة';
    case 'active':
      return 'نشط';
    case 'paused':
      return 'موقوف';
    case 'rejected':
      return 'مرفوض';
    case 'expired':
      return 'منتهي';
    default:
      return status;
  }
}
