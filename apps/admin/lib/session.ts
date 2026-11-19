'use client';

import type { AuthTokens, AuthUser } from './api';

const STORAGE_KEY = 'tarweej.admin.session';

export type AdminSession = {
  user: AuthUser;
  tokens: AuthTokens;
};

export function loadSession(): AdminSession | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as AdminSession;
  } catch {
    return null;
  }
}

export function saveSession(session: AdminSession): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}

export function hasAdminAccess(user: AuthUser | null | undefined): boolean {
  if (!user) {
    return false;
  }
  return (
    user.roles.includes('super_admin') ||
    user.roles.includes('moderator') ||
    (user.permissions?.length ?? 0) > 0
  );
}
