'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { logout } from '../lib/api';
import { clearSession, loadSession, type WebSession } from '../lib/session';

const links = [
  { href: '/dashboard', label: 'ملخص' },
  { href: '/dashboard/listings', label: 'إعلاناتي' },
  { href: '/dashboard/favorites', label: 'المفضلة' },
  { href: '/dashboard/messages', label: 'الرسائل' },
  { href: '/dashboard/payments', label: 'المدفوعات' },
  { href: '/dashboard/settings', label: 'الإعدادات' },
];

export function DashboardShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<WebSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const current = loadSession();
    if (!current?.tokens.accessToken) {
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
      <div className="container page-pad">
        <div className="panel state-box">جاري تحميل الحساب…</div>
      </div>
    );
  }

  return (
    <div className="container dashboard-shell">
      <aside className="dashboard-nav">
        <div className="brand" style={{ marginBottom: '0.5rem' }}>
          حسابي
        </div>
        <p style={{ margin: '0 0 0.75rem', color: 'var(--muted)', fontSize: '0.85rem' }}>
          {session.user.displayName || session.user.email || 'مستخدم ترويج'}
        </p>
        {links.map((link) => {
          const active =
            pathname === link.href ||
            (link.href !== '/dashboard' && pathname.startsWith(`${link.href}/`));
          return (
            <Link key={link.href} href={link.href} className={active ? 'active' : undefined}>
              {link.label}
            </Link>
          );
        })}
        <button
          type="button"
          className="btn btn-ghost"
          style={{ marginTop: '0.75rem', width: '100%' }}
          onClick={() => void onLogout()}
        >
          تسجيل الخروج
        </button>
      </aside>
      <div>{children}</div>
    </div>
  );
}
