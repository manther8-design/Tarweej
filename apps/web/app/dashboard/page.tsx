'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { DashboardShell } from '../../components/DashboardShell';
import { ApiError, listMyListings, type OwnerListing } from '../../lib/api';
import { loadSession } from '../../lib/session';

export default function DashboardOverviewPage() {
  const [items, setItems] = useState<OwnerListing[]>([]);
  const [total, setTotal] = useState(0);
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
        const page = await listMyListings(session.tokens.accessToken, { pageSize: 50 });
        if (cancelled) return;
        setItems(page.items);
        setTotal(page.total);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : 'تعذّر تحميل الملخص');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const counts = {
    draft: items.filter((i) => i.status === 'draft').length,
    pending: items.filter((i) => i.status === 'pending_review').length,
    active: items.filter((i) => i.status === 'active').length,
    other: items.filter((i) => !['draft', 'pending_review', 'active'].includes(i.status)).length,
  };

  return (
    <DashboardShell>
      <section className="panel">
        <h1 style={{ marginTop: 0 }}>لوحة المستخدم</h1>
        <p style={{ color: 'var(--muted)' }}>
          ملخص حسابك على ترويج — الإعلانات والحالة الحالية من واجهة{' '}
          <span style={{ fontFamily: 'var(--font-en)' }}>/my/listings</span>.
        </p>

        {loading ? <p style={{ color: 'var(--muted)' }}>جاري التحميل…</p> : null}
        {error ? <p style={{ color: 'var(--status-error)' }}>{error}</p> : null}

        {!loading && !error ? (
          <>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              <div className="panel">
                <strong>إعلاناتي</strong>
                <p style={{ color: 'var(--muted)', margin: '0.4rem 0 0.8rem' }}>
                  الإجمالي {total} · مسودة {counts.draft} · مراجعة {counts.pending} · نشط{' '}
                  {counts.active}
                  {counts.other ? ` · أخرى ${counts.other}` : ''}
                </p>
                <Link className="btn btn-ghost" href="/dashboard/listings">
                  إدارة
                </Link>
              </div>
              <div className="panel">
                <strong>المميزة</strong>
                <p style={{ color: 'var(--muted)', margin: '0.4rem 0 0.8rem' }}>
                  ترقية ظهور الإعلان بعد الدفع المؤكد من الخادم.
                </p>
                <Link className="btn btn-ghost" href="/dashboard/payments">
                  الترقية
                </Link>
              </div>
              <div className="panel">
                <strong>الرسائل</strong>
                <p style={{ color: 'var(--muted)', margin: '0.4rem 0 0.8rem' }}>
                  محادثات مرتبطة بالإعلانات.
                </p>
                <Link className="btn btn-ghost" href="/dashboard/messages">
                  فتح
                </Link>
              </div>
              <div className="panel">
                <strong>المفضلة</strong>
                <p style={{ color: 'var(--muted)', margin: '0.4rem 0 0.8rem' }}>
                  الإعلانات المحفوظة في حسابك.
                </p>
                <Link className="btn btn-ghost" href="/dashboard/favorites">
                  عرض
                </Link>
              </div>
            </div>
          </>
        ) : null}
      </section>
    </DashboardShell>
  );
}
