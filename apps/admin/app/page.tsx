'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { AdminShell } from '../components/AdminShell';
import { ApiError, apiFetch } from '../lib/api';
import { loadSession } from '../lib/session';

type Overview = {
  generatedAt: string;
  users: { total: number; active: number };
  listings: { total: number; byStatus: Record<string, number>; pendingReview: number };
  payments: { total: number; byStatus: Record<string, number> };
  reports: { open: number; inReview: number; queue: number };
  featured: { active: number };
  recentAudit: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string | null;
    createdAt: string;
    actor: { id: string; email: string | null; displayName: string | null } | null;
  }>;
};

export default function AdminHomePage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const session = loadSession();
    if (!session) {
      return;
    }
    try {
      const data = await apiFetch<Overview>('/admin/dashboard/overview', {
        token: session.tokens.accessToken,
      });
      setOverview(data);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load overview');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const listingStatuses = overview
    ? Object.entries(overview.listings.byStatus).sort((a, b) => b[1] - a[1])
    : [];
  const paymentStatuses = overview
    ? Object.entries(overview.payments.byStatus).sort((a, b) => b[1] - a[1])
    : [];

  return (
    <AdminShell>
      <section style={{ maxWidth: 1100, display: 'grid', gap: '1.5rem' }}>
        <header
          style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '1.8rem' }}>Ops overview</h2>
            <p style={{ margin: '0.4rem 0 0', color: 'var(--muted)', lineHeight: 1.55 }}>
              Live KPIs for users, listings, payments, open reports, and active featured promotions.
            </p>
          </div>
          <button type="button" onClick={() => void load()} style={ghostBtn}>
            Refresh
          </button>
        </header>

        {error ? <p style={{ color: '#f0b4b4', margin: 0 }}>{error}</p> : null}

        {!overview && !error ? <p style={{ color: 'var(--muted)' }}>Loading KPIs…</p> : null}

        {overview ? (
          <>
            <div style={kpiGrid}>
              <Kpi
                label="Users"
                value={overview.users.total}
                hint={`${overview.users.active} active`}
                href="/users"
              />
              <Kpi
                label="Listings"
                value={overview.listings.total}
                hint={`${overview.listings.pendingReview} pending review`}
                href="/listings"
              />
              <Kpi
                label="Open reports"
                value={overview.reports.queue}
                hint={`${overview.reports.open} open · ${overview.reports.inReview} in review`}
                href="/reports"
              />
              <Kpi
                label="Payments"
                value={overview.payments.total}
                hint={
                  paymentStatuses.map(([s, n]) => `${s}: ${n}`).join(' · ') || 'No payments yet'
                }
                href="/payments"
              />
              <Kpi
                label="Featured active"
                value={overview.featured.active}
                hint="Currently promoted listings"
                href="/promotions"
              />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '1.25rem',
              }}
            >
              <article style={panel}>
                <h3 style={panelTitle}>Listings by status</h3>
                {listingStatuses.length === 0 ? (
                  <p style={{ color: 'var(--muted)', margin: 0 }}>No listings yet.</p>
                ) : (
                  <ul style={listReset}>
                    {listingStatuses.map(([status, count]) => (
                      <li key={status} style={statRow}>
                        <span>{status}</span>
                        <strong>{count}</strong>
                      </li>
                    ))}
                  </ul>
                )}
              </article>

              <article style={panel}>
                <h3 style={panelTitle}>Queues & shortcuts</h3>
                <ul style={listReset}>
                  {[
                    [
                      '/listings',
                      'Listing moderation',
                      `${overview.listings.pendingReview} pending`,
                    ],
                    ['/reports', 'Reports queue', `${overview.reports.queue} open`],
                    ['/payments', 'Payments trail', `${overview.payments.total} records`],
                    ['/audit', 'Audit browser', `${overview.recentAudit.length} recent`],
                    ['/users', 'Users & roles', 'Assign / revoke'],
                    ['/settings', 'Settings & flags', 'Config'],
                  ].map(([href, title, meta]) => (
                    <li key={href} style={statRow}>
                      <Link href={href} style={{ color: 'inherit' }}>
                        {title}
                      </Link>
                      <span style={{ color: 'var(--muted)', fontSize: 13 }}>{meta}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </div>

            <article style={panel}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <h3 style={{ ...panelTitle, margin: 0 }}>Recent audit</h3>
                <Link href="/audit" style={{ color: 'var(--accent)', fontSize: 14 }}>
                  Open audit browser →
                </Link>
              </div>
              {overview.recentAudit.length === 0 ? (
                <p style={{ color: 'var(--muted)', margin: '0.75rem 0 0' }}>
                  No audit entries yet.
                </p>
              ) : (
                <ul style={{ ...listReset, marginTop: 12 }}>
                  {overview.recentAudit.map((entry) => (
                    <li key={entry.id} style={auditRow}>
                      <div>
                        <code style={{ color: '#c9d7ea' }}>{entry.action}</code>
                        <span style={{ color: 'var(--muted)', marginLeft: 8, fontSize: 13 }}>
                          {entry.entityType}
                          {entry.entityId ? ` · ${entry.entityId.slice(0, 8)}` : ''}
                        </span>
                      </div>
                      <div style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'right' }}>
                        {entry.actor?.displayName || entry.actor?.email || 'system'}
                        <br />
                        {new Date(entry.createdAt).toISOString().replace('T', ' ').slice(0, 19)} UTC
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <p style={{ margin: '0.85rem 0 0', color: 'var(--muted)', fontSize: 12 }}>
                Generated {new Date(overview.generatedAt).toISOString()}
              </p>
            </article>
          </>
        ) : null}
      </section>
    </AdminShell>
  );
}

function Kpi({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: number;
  hint: string;
  href: string;
}) {
  return (
    <Link href={href} style={kpiCard}>
      <span style={{ color: 'var(--muted)', fontSize: 13, letterSpacing: '0.04em' }}>{label}</span>
      <strong style={{ fontSize: '1.85rem', marginTop: 6, display: 'block' }}>{value}</strong>
      <span style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4, display: 'block' }}>
        {hint}
      </span>
    </Link>
  );
}

const kpiGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: 12,
};

const kpiCard: CSSProperties = {
  display: 'block',
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: '1rem 1.1rem',
  background: 'rgba(26, 34, 44, 0.72)',
};

const panel: CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: '1rem 1.1rem',
  background: 'rgba(26, 34, 44, 0.55)',
};

const panelTitle: CSSProperties = {
  margin: '0 0 0.75rem',
  fontSize: '1.05rem',
};

const listReset: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'grid',
  gap: 8,
};

const statRow: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  borderTop: '1px solid var(--border)',
  paddingTop: 8,
  fontSize: 14,
};

const auditRow: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 16,
  borderTop: '1px solid var(--border)',
  paddingTop: 10,
};

const ghostBtn: CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--border)',
  color: 'var(--text)',
  borderRadius: 8,
  padding: '0.55rem 0.9rem',
  cursor: 'pointer',
  height: 'fit-content',
};
