'use client';

import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { AdminShell } from '../../components/AdminShell';
import { ApiError, apiFetch } from '../../lib/api';
import { loadSession } from '../../lib/session';

type PendingItem = {
  id: string;
  title: string;
  status: string;
  priceAmount: number | null;
  currencyCode: string | null;
  updatedAt: string | null;
  owner?: { id: string; email: string | null; displayName: string | null };
};

export default function ListingsModerationPage() {
  const [items, setItems] = useState<PendingItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const session = loadSession();
    if (!session) {
      return;
    }
    try {
      const res = await apiFetch<{ items: PendingItem[] }>('/admin/listings/pending', {
        token: session.tokens.accessToken,
      });
      setItems(res.items);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load pending listings');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function approve(id: string) {
    const session = loadSession();
    if (!session) {
      return;
    }
    setBusyId(id);
    try {
      await apiFetch(`/admin/listings/${id}/approve`, {
        method: 'POST',
        token: session.tokens.accessToken,
        body: JSON.stringify({ reason: 'Approved from admin queue' }),
      });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Approve failed');
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id: string) {
    const session = loadSession();
    if (!session) {
      return;
    }
    const reason = (rejectReasons[id] || '').trim();
    if (!reason) {
      setError('Rejection reason is required');
      return;
    }
    setBusyId(id);
    try {
      await apiFetch(`/admin/listings/${id}/reject`, {
        method: 'POST',
        token: session.tokens.accessToken,
        body: JSON.stringify({ reason }),
      });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Reject failed');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminShell>
      <section style={{ maxWidth: 960 }}>
        <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.8rem' }}>Pending listings</h2>
        <p style={{ margin: '0 0 1.25rem', color: 'var(--muted)', lineHeight: 1.55 }}>
          Approve or reject listings awaiting moderation. Actions are audited.
        </p>
        {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
        {items.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>No listings pending review.</p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 16 }}>
            {items.map((item) => (
              <li key={item.id} style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: '1.05rem' }}>{item.title}</strong>
                    <span style={{ color: 'var(--muted)', fontSize: 14 }}>
                      {item.owner?.displayName || item.owner?.email || 'Unknown owner'} ·{' '}
                      {item.priceAmount ?? '—'} {item.currencyCode ?? ''}
                    </span>
                  </div>
                  <code style={{ fontSize: 12 }}>{item.id.slice(0, 8)}</code>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                  <button
                    type="button"
                    disabled={busyId === item.id}
                    onClick={() => void approve(item.id)}
                    style={approveBtn}
                  >
                    Approve
                  </button>
                  <input
                    value={rejectReasons[item.id] ?? ''}
                    onChange={(e) =>
                      setRejectReasons((prev) => ({ ...prev, [item.id]: e.target.value }))
                    }
                    placeholder="Rejection reason"
                    style={inputStyle}
                  />
                  <button
                    type="button"
                    disabled={busyId === item.id}
                    onClick={() => void reject(item.id)}
                    style={rejectBtn}
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AdminShell>
  );
}

const cardStyle: CSSProperties = {
  borderTop: '1px solid var(--border)',
  paddingTop: 12,
};

const inputStyle: CSSProperties = {
  flex: 1,
  minWidth: 180,
  padding: '8px 10px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'inherit',
};

const approveBtn: CSSProperties = {
  padding: '8px 14px',
  borderRadius: 8,
  border: 'none',
  background: '#0f766e',
  color: '#fff',
  cursor: 'pointer',
};

const rejectBtn: CSSProperties = {
  padding: '8px 14px',
  borderRadius: 8,
  border: '1px solid #b91c1c',
  background: 'transparent',
  color: '#b91c1c',
  cursor: 'pointer',
};
