'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { logout } from '../lib/api';
import { clearSession, hasAdminAccess, loadSession, type AdminSession } from '../lib/session';

const nav = [
  { href: '/', label: 'Overview' },
  { href: '/categories', label: 'Categories' },
  { href: '/settings', label: 'Settings' },
  { href: '/feature-flags', label: 'Feature flags' },
  { href: '/roles', label: 'Roles' },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const current = loadSession();
    if (!current || !hasAdminAccess(current.user)) {
      clearSession();
      router.replace('/login');
      return;
    }
    setSession(current);
    setReady(true);
  }, [router]);

  async function onLogout() {
    try {
      if (session?.tokens.accessToken) {
        await logout(session.tokens.accessToken);
      }
    } catch {
      // Session may already be revoked; still clear local state.
    }
    clearSession();
    router.replace('/login');
  }

  if (!ready || !session) {
    return (
      <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <p style={{ color: 'var(--muted)' }}>Loading…</p>
      </main>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '240px 1fr' }}>
      <aside
        style={{
          borderRight: '1px solid var(--border)',
          background: 'rgba(15, 20, 25, 0.72)',
          backdropFilter: 'blur(8px)',
          padding: '1.5rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
        }}
      >
        <div>
          <p style={{ margin: 0, color: 'var(--muted)', letterSpacing: '0.08em', fontSize: 12 }}>
            ADMIN
          </p>
          <h1 style={{ margin: '0.35rem 0 0', fontSize: '1.6rem' }}>ترويج</h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)', fontSize: 13 }}>Tarweej</p>
        </div>

        <nav style={{ display: 'grid', gap: 6 }}>
          {nav.map((item) => {
            const active =
              pathname === item.href || (item.href !== '/' && pathname.startsWith(`${item.href}/`));
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  ...navLinkStyle,
                  background: active ? 'rgba(47, 111, 237, 0.18)' : 'transparent',
                  color: active ? '#fff' : 'var(--muted)',
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ marginTop: 'auto', display: 'grid', gap: 8 }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)' }}>
            {session.user.email}
            <br />
            <span style={{ color: 'var(--text)' }}>{session.user.roles.join(', ')}</span>
          </p>
          <button type="button" onClick={() => void onLogout()} style={buttonStyle}>
            Sign out
          </button>
        </div>
      </aside>

      <main style={{ padding: '2rem' }}>{children}</main>
    </div>
  );
}

const navLinkStyle: CSSProperties = {
  display: 'block',
  padding: '0.65rem 0.8rem',
  borderRadius: 8,
  fontWeight: 560,
};

const buttonStyle: CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--border)',
  color: 'var(--text)',
  borderRadius: 8,
  padding: '0.55rem 0.75rem',
  cursor: 'pointer',
  textAlign: 'left',
};
