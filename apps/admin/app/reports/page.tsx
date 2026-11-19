'use client';

import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { AdminShell } from '../../components/AdminShell';
import { ApiError, apiFetch } from '../../lib/api';
import { loadSession } from '../../lib/session';

type ReportItem = {
  id: string;
  reasonCode: string;
  status: string;
  classification: string | null;
  resolutionAction: string | null;
  notes: string | null;
  createdAt: string;
  reporter?: { id: string; email: string | null; displayName: string | null };
  targetUser?: { id: string; email: string | null; displayName: string | null } | null;
  listing?: { id: string; title: string; status: string; ownerId: string } | null;
};

export default function ReportsModerationPage() {
  const [items, setItems] = useState<ReportItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [closeReasons, setCloseReasons] = useState<Record<string, string>>({});
  const [classifications, setClassifications] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const session = loadSession();
    if (!session) {
      return;
    }
    try {
      const res = await apiFetch<{ items: ReportItem[] }>('/admin/reports', {
        token: session.tokens.accessToken,
      });
      setItems(res.items);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load reports queue');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function classify(id: string) {
    const session = loadSession();
    if (!session) {
      return;
    }
    const classification = classifications[id] || 'policy_violation';
    setBusyId(id);
    try {
      await apiFetch(`/admin/reports/${id}/classify`, {
        method: 'POST',
        token: session.tokens.accessToken,
        body: JSON.stringify({ classification }),
      });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Classify failed');
    } finally {
      setBusyId(null);
    }
  }

  async function hideListing(id: string) {
    const session = loadSession();
    if (!session) {
      return;
    }
    setBusyId(id);
    try {
      await apiFetch(`/admin/reports/${id}/act`, {
        method: 'POST',
        token: session.tokens.accessToken,
        body: JSON.stringify({ action: 'hide_listing', notes: 'Hidden from reports queue' }),
      });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Hide listing failed');
    } finally {
      setBusyId(null);
    }
  }

  async function close(id: string, status: 'resolved' | 'dismissed') {
    const session = loadSession();
    if (!session) {
      return;
    }
    const reason = (closeReasons[id] || '').trim();
    if (!reason) {
      setError('Close reason is required');
      return;
    }
    setBusyId(id);
    try {
      await apiFetch(`/admin/reports/${id}/close`, {
        method: 'POST',
        token: session.tokens.accessToken,
        body: JSON.stringify({ status, reason }),
      });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Close failed');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminShell>
      <section style={{ maxWidth: 960 }}>
        <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.8rem' }}>Reports queue</h2>
        <p style={{ margin: '0 0 1.25rem', color: 'var(--muted)', lineHeight: 1.55 }}>
          Classify, act (hide listing), and close user-filed reports. Decisions are audited.
        </p>
        {error ? <p style={{ color: 'crimson' }}>{error}</p> : null}
        {items.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>No open reports.</p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 16 }}>
            {items.map((item) => (
              <li key={item.id} style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: '1.05rem' }}>
                      {item.listing?.title || 'User report'} · {item.reasonCode}
                    </strong>
                    <span style={{ color: 'var(--muted)', fontSize: 14 }}>
                      Reporter: {item.reporter?.displayName || item.reporter?.email || '—'} ·
                      Status: {item.status}
                      {item.classification ? ` · Class: ${item.classification}` : ''}
                      {item.resolutionAction ? ` · Action: ${item.resolutionAction}` : ''}
                    </span>
                    {item.notes ? (
                      <p style={{ margin: '0.5rem 0 0', fontSize: 14 }}>{item.notes}</p>
                    ) : null}
                  </div>
                  <code style={{ fontSize: 12 }}>{item.id.slice(0, 8)}</code>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                  <select
                    value={classifications[item.id] || 'policy_violation'}
                    onChange={(e) =>
                      setClassifications((prev) => ({ ...prev, [item.id]: e.target.value }))
                    }
                    style={inputStyle}
                  >
                    <option value="spam">spam</option>
                    <option value="policy_violation">policy_violation</option>
                    <option value="fraud">fraud</option>
                    <option value="duplicate">duplicate</option>
                    <option value="legitimate">legitimate</option>
                    <option value="unclear">unclear</option>
                  </select>
                  <button
                    type="button"
                    disabled={busyId === item.id}
                    onClick={() => void classify(item.id)}
                    style={approveBtn}
                  >
                    Classify
                  </button>
                  {item.listing ? (
                    <button
                      type="button"
                      disabled={busyId === item.id}
                      onClick={() => void hideListing(item.id)}
                      style={warnBtn}
                    >
                      Hide listing
                    </button>
                  ) : null}
                  <input
                    type="text"
                    placeholder="Close reason"
                    value={closeReasons[item.id] || ''}
                    onChange={(e) =>
                      setCloseReasons((prev) => ({ ...prev, [item.id]: e.target.value }))
                    }
                    style={{ ...inputStyle, minWidth: 180, flex: 1 }}
                  />
                  <button
                    type="button"
                    disabled={busyId === item.id}
                    onClick={() => void close(item.id, 'resolved')}
                    style={approveBtn}
                  >
                    Resolve
                  </button>
                  <button
                    type="button"
                    disabled={busyId === item.id}
                    onClick={() => void close(item.id, 'dismissed')}
                    style={rejectBtn}
                  >
                    Dismiss
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
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: '1rem 1.1rem',
  background: 'rgba(15, 20, 25, 0.45)',
};

const inputStyle: CSSProperties = {
  background: 'rgba(0,0,0,0.25)',
  border: '1px solid var(--border)',
  color: 'var(--text)',
  borderRadius: 8,
  padding: '0.45rem 0.65rem',
};

const approveBtn: CSSProperties = {
  background: 'rgba(47, 111, 237, 0.85)',
  border: 'none',
  color: '#fff',
  borderRadius: 8,
  padding: '0.45rem 0.85rem',
  cursor: 'pointer',
  fontWeight: 600,
};

const warnBtn: CSSProperties = {
  background: 'rgba(201, 148, 36, 0.85)',
  border: 'none',
  color: '#111',
  borderRadius: 8,
  padding: '0.45rem 0.85rem',
  cursor: 'pointer',
  fontWeight: 600,
};

const rejectBtn: CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--border)',
  color: 'var(--text)',
  borderRadius: 8,
  padding: '0.45rem 0.85rem',
  cursor: 'pointer',
};
