const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:3000/api/v1';

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
  });

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
    body: JSON.stringify({ email, password, deviceLabel: 'tarweej-admin' }),
  });
}

export function logout(token: string) {
  return apiFetch<{ revoked: boolean }>('/identity/auth/logout', {
    method: 'POST',
    token,
  });
}

export function fetchMe(token: string) {
  return apiFetch<AuthUser & { roles: string[]; permissions: string[] }>('/identity/me', {
    token,
  });
}
