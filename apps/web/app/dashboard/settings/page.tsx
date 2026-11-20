'use client';

import { useEffect, useState } from 'react';
import { DashboardShell } from '../../../components/DashboardShell';
import { ApiError, fetchMe, type AuthUser } from '../../../lib/api';
import { loadSession } from '../../../lib/session';

export default function DashboardSettingsPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = loadSession();
    if (!session?.tokens.accessToken) {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const me = await fetchMe(session.tokens.accessToken);
        if (cancelled) return;
        setUser(me);
      } catch (err) {
        if (cancelled) return;
        // Fall back to cached session user if /me fails.
        setUser(session.user);
        setError(err instanceof ApiError ? err.message : null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <DashboardShell>
      <section className="panel">
        <h1 style={{ marginTop: 0 }}>الإعدادات</h1>
        <p style={{ color: 'var(--muted)' }}>بيانات الحساب من واجهة الهوية.</p>
        {loading ? <p style={{ color: 'var(--muted)' }}>جاري التحميل…</p> : null}
        {error ? (
          <p style={{ color: 'var(--status-warning)', fontSize: '0.85rem' }}>
            تعذّر تحديث الملف من الخادم ({error}) — عرض الجلسة المحلية.
          </p>
        ) : null}
        {user ? (
          <dl style={{ display: 'grid', gap: '0.75rem', margin: '1rem 0 0' }}>
            <div>
              <dt style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>الاسم</dt>
              <dd style={{ margin: '0.2rem 0 0' }}>{user.displayName || '—'}</dd>
            </div>
            <div>
              <dt style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>البريد</dt>
              <dd style={{ margin: '0.2rem 0 0', fontFamily: 'var(--font-en)' }}>
                {user.email || '—'}
              </dd>
            </div>
            <div>
              <dt style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>الأدوار</dt>
              <dd style={{ margin: '0.2rem 0 0', fontFamily: 'var(--font-en)' }}>
                {(user.roles ?? []).join(', ') || 'user'}
              </dd>
            </div>
          </dl>
        ) : null}
      </section>
    </DashboardShell>
  );
}
