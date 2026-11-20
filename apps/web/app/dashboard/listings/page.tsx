'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { DashboardShell } from '../../../components/DashboardShell';
import {
  ApiError,
  formatPrice,
  listMyListings,
  statusLabelAr,
  type OwnerListing,
} from '../../../lib/api';
import { loadSession } from '../../../lib/session';

export default function DashboardListingsPage() {
  const [items, setItems] = useState<OwnerListing[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  useEffect(() => {
    const session = loadSession();
    if (!session?.tokens.accessToken) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const page = await listMyListings(session.tokens.accessToken, {
          status: status || undefined,
          pageSize: 50,
        });
        if (cancelled) return;
        setItems(page.items);
        setTotal(page.total);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : 'تعذّر تحميل الإعلانات');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status]);

  return (
    <DashboardShell>
      <section className="panel">
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
          }}
        >
          <div>
            <h1 style={{ margin: 0 }}>إعلاناتي</h1>
            <p style={{ margin: '0.35rem 0 0', color: 'var(--muted)' }}>
              {loading ? 'جاري التحميل…' : `${total} إعلان`}
            </p>
          </div>
          <select
            className="select"
            style={{ width: 'auto', minWidth: 160 }}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="تصفية الحالة"
          >
            <option value="">كل الحالات</option>
            <option value="draft">مسودة</option>
            <option value="pending_review">قيد المراجعة</option>
            <option value="active">نشط</option>
            <option value="paused">موقوف</option>
            <option value="rejected">مرفوض</option>
          </select>
        </div>

        {error ? <p style={{ color: 'var(--status-error)' }}>{error}</p> : null}

        {!loading && !error && items.length === 0 ? (
          <div className="state-box">
            لا توجد إعلانات بعد.
            <div style={{ marginTop: '1rem' }}>
              <Link className="btn btn-primary" href="/">
                تصفح السوق
              </Link>
            </div>
          </div>
        ) : null}

        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {items.map((item) => (
            <article
              key={item.id}
              className="panel"
              style={{
                display: 'grid',
                gridTemplateColumns: '88px 1fr auto',
                gap: '0.9rem',
                alignItems: 'center',
                padding: '0.85rem',
              }}
            >
              <div
                style={{
                  width: 88,
                  height: 72,
                  borderRadius: 12,
                  overflow: 'hidden',
                  background: 'var(--slate-100)',
                }}
              >
                {item.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.coverImageUrl}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : null}
              </div>
              <div>
                <strong style={{ display: 'block', marginBottom: 4 }}>{item.title}</strong>
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.85rem' }}>
                  {formatPrice(item.priceAmount, item.currencyCode)} · {item.viewCount} مشاهدة
                </p>
                {item.rejectionReason ? (
                  <p
                    style={{
                      margin: '0.35rem 0 0',
                      color: 'var(--status-error)',
                      fontSize: '0.8rem',
                    }}
                  >
                    {item.rejectionReason}
                  </p>
                ) : null}
              </div>
              <div style={{ textAlign: 'end', display: 'grid', gap: 8, justifyItems: 'end' }}>
                <span className={`status-pill status-${item.status}`}>
                  {statusLabelAr(item.status)}
                </span>
                {item.status === 'active' ? (
                  <Link
                    className="btn btn-ghost"
                    href={`/listings/${item.id}`}
                    style={{ padding: '0.45rem 0.7rem' }}
                  >
                    عرض
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>
    </DashboardShell>
  );
}
