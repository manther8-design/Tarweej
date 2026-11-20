'use client';

import type { AuthTokens, AuthUser } from './api';

const STORAGE_KEY = 'tarweej.web.session';

export type WebSession = {
  user: AuthUser;
  tokens: AuthTokens;
};

export function loadSession(): WebSession | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as WebSession;
  } catch {
    return null;
  }
}

export function saveSession(session: WebSession): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}

export function getAccessToken(): string | null {
  return loadSession()?.tokens.accessToken ?? null;
}
