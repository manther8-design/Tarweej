'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { DashboardShell } from '../../../components/DashboardShell';
import { ApiError, formatPrice, listFavorites, type FavoriteListing } from '../../../lib/api';
import { loadSession } from '../../../lib/session';

type FavoriteRow = { listingId: string; listing: FavoriteListing | null };

export default function DashboardFavoritesPage() {
  const [items, setItems] = useState<FavoriteRow[]>([]);
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
        const page = await listFavorites(session.tokens.accessToken);
        if (cancelled) return;
        setItems(page.items ?? []);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : 'تعذّر تحميل المفضلة');
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
        <h1 style={{ marginTop: 0 }}>المفضلة</h1>
        <p style={{ color: 'var(--muted)' }}>الإعلانات المحفوظة في حسابك.</p>
        {loading ? <p style={{ color: 'var(--muted)' }}>جاري التحميل…</p> : null}
        {error ? <p style={{ color: 'var(--status-error)' }}>{error}</p> : null}
        {!loading && !error && items.length === 0 ? (
          <div className="state-box">لا توجد عناصر في المفضلة بعد.</div>
        ) : null}
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {items.map((row) => {
            const listing = row.listing;
            return (
              <article key={row.listingId} className="panel" style={{ padding: '0.9rem' }}>
                <strong>{listing?.title ?? row.listingId}</strong>
                {listing ? (
                  <p style={{ margin: '0.35rem 0', color: 'var(--muted)' }}>
                    {formatPrice(listing.priceAmount, listing.currencyCode)}
                  </p>
                ) : null}
                <Link className="btn btn-ghost" href={`/listings/${row.listingId}`}>
                  عرض الإعلان
                </Link>
              </article>
            );
          })}
        </div>
      </section>
    </DashboardShell>
  );
}
