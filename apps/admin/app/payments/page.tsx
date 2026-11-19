'use client';

import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { AdminShell } from '../../components/AdminShell';
import { ApiError, apiFetch } from '../../lib/api';
import { loadSession } from '../../lib/session';

type PaymentItem = {
  id: string;
  purpose: string;
  amount: string;
  currencyCode: string;
  status: string;
  providerCode: string;
  createdAt: string;
  paidAt: string | null;
  failureReason: string | null;
  user?: { id: string; email: string | null; displayName: string | null };
  promotion?: {
    id: string;
    listingId: string;
    status: string;
    placement: string;
    startsAt: string | null;
    endsAt: string | null;
  } | null;
};

type PaymentsPage = {
  page: number;
  pageSize: number;
  total: number;
  items: PaymentItem[];
};

export default function PaymentsOpsPage() {
  const [data, setData] = useState<PaymentsPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const load = useCallback(async () => {
    const session = loadSession();
    if (!session) {
      return;
    }
    try {
      const query = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (status) {
        query.set('status', status);
      }
      const res = await apiFetch<PaymentsPage>(`/admin/commercial/payments?${query.toString()}`, {
        token: session.tokens.accessToken,
      });
      setData(res);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load payments');
    }
  }, [page, status]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AdminShell>
      <section style={{ maxWidth: 1040, display: 'grid', gap: '1.25rem' }}>
        <header>
          <h2 style={{ margin: 0, fontSize: '1.8rem' }}>Payments</h2>
          <p style={{ margin: '0.4rem 0 0', color: 'var(--muted)' }}>
            Ops trail of payment records. Soft statuses only — no hard deletes of financial rows.
          </p>
        </header>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['', 'pending', 'processing', 'paid', 'failed', 'cancelled', 'refunded'].map((value) => (
            <button
              key={value || 'all'}
              type="button"
              onClick={() => {
                setStatus(value);
                setPage(1);
              }}
              style={{
                ...chipStyle,
                background: status === value ? 'rgba(47, 111, 237, 0.22)' : 'transparent',
              }}
            >
              {value || 'all'}
            </button>
          ))}
        </div>

        {error ? <p style={{ color: '#f0b4b4', margin: 0 }}>{error}</p> : null}
        {data ? (
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13 }}>
            Page {data.page} · {data.total} payments
          </p>
        ) : null}

        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 12 }}>
          {(data?.items ?? []).map((payment) => (
            <li key={payment.id} style={rowStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <strong>
                    {payment.amount} {payment.currencyCode}
                  </strong>
                  <span style={{ marginLeft: 8, color: 'var(--muted)', fontSize: 13 }}>
                    {payment.purpose} · {payment.providerCode}
                  </span>
                  <p style={{ margin: '0.3rem 0 0', color: 'var(--muted)', fontSize: 13 }}>
                    {payment.user?.displayName || payment.user?.email || payment.user?.id || '—'}
                    {payment.promotion
                      ? ` · promo ${payment.promotion.status} (${payment.promotion.placement})`
                      : ''}
                  </p>
                  {payment.failureReason ? (
                    <p style={{ margin: '0.3rem 0 0', color: '#f0b4b4', fontSize: 13 }}>
                      {payment.failureReason}
                    </p>
                  ) : null}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <code style={{ fontSize: 12 }}>{payment.status}</code>
                  <p style={{ margin: '0.3rem 0 0', color: 'var(--muted)', fontSize: 12 }}>
                    {new Date(payment.createdAt).toISOString().replace('T', ' ').slice(0, 19)} UTC
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {(data?.items.length ?? 0) === 0 && !error ? (
          <p style={{ color: 'var(--muted)' }}>No payments for this filter.</p>
        ) : null}

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            style={btnStyle}
          >
            Previous
          </button>
          <button
            type="button"
            disabled={!data || page * pageSize >= data.total}
            onClick={() => setPage((p) => p + 1)}
            style={btnStyle}
          >
            Next
          </button>
        </div>
      </section>
    </AdminShell>
  );
}

const rowStyle: CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 10,
  padding: '1rem 1.1rem',
  background: 'rgba(26, 34, 44, 0.65)',
};

const btnStyle: CSSProperties = {
  padding: '8px 14px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'rgba(47, 111, 237, 0.18)',
  color: 'inherit',
  cursor: 'pointer',
};

const chipStyle: CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 999,
  padding: '4px 12px',
  color: 'inherit',
  cursor: 'pointer',
  fontSize: 13,
};
