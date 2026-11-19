'use client';

import { useCallback, useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import { AdminShell } from '../../components/AdminShell';
import { ApiError, apiFetch } from '../../lib/api';
import { loadSession } from '../../lib/session';

type AuditEntry = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
  beforeJson?: unknown;
  afterJson?: unknown;
  actor: { id: string; email: string | null; displayName: string | null } | null;
};

type AuditPage = {
  total: number;
  limit: number;
  offset: number;
  items: AuditEntry[];
};

export default function AuditBrowserPage() {
  const [data, setData] = useState<AuditPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [offset, setOffset] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);
  const limit = 40;

  const load = useCallback(async () => {
    const session = loadSession();
    if (!session) {
      return;
    }
    try {
      const query = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
      });
      if (action.trim()) {
        query.set('action', action.trim());
      }
      if (entityType.trim()) {
        query.set('entityType', entityType.trim());
      }
      const res = await apiFetch<AuditPage>(`/admin/audit/entries?${query.toString()}`, {
        token: session.tokens.accessToken,
      });
      setData(res);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load audit entries');
    }
  }, [action, entityType, offset]);

  useEffect(() => {
    void load();
  }, [load]);

  function onFilter(event: FormEvent) {
    event.preventDefault();
    setOffset(0);
    void load();
  }

  return (
    <AdminShell>
      <section style={{ maxWidth: 1040, display: 'grid', gap: '1.25rem' }}>
        <header>
          <h2 style={{ margin: 0, fontSize: '1.8rem' }}>Audit browser</h2>
          <p style={{ margin: '0.4rem 0 0', color: 'var(--muted)' }}>
            Append-only trail of sensitive ops. Financial and audit records are never hard-deleted.
          </p>
        </header>

        <form onSubmit={onFilter} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            value={action}
            onChange={(e) => setAction(e.target.value)}
            placeholder="Action contains…"
            style={inputStyle}
          />
          <input
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            placeholder="Entity type (exact)"
            style={inputStyle}
          />
          <button type="submit" style={btnStyle}>
            Filter
          </button>
        </form>

        {error ? <p style={{ color: '#f0b4b4', margin: 0 }}>{error}</p> : null}
        {data ? (
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13 }}>
            Showing {data.items.length} of {data.total}
          </p>
        ) : null}

        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
          {(data?.items ?? []).map((entry) => (
            <li key={entry.id} style={rowStyle}>
              <button
                type="button"
                onClick={() => setExpanded((prev) => (prev === entry.id ? null : entry.id))}
                style={rowBtn}
              >
                <div>
                  <code style={{ color: '#c9d7ea' }}>{entry.action}</code>
                  <span style={{ color: 'var(--muted)', marginLeft: 8, fontSize: 13 }}>
                    {entry.entityType}
                    {entry.entityId ? ` · ${entry.entityId}` : ''}
                  </span>
                </div>
                <div style={{ color: 'var(--muted)', fontSize: 13, textAlign: 'right' }}>
                  {entry.actor?.email || entry.actor?.displayName || 'system'}
                  <br />
                  {new Date(entry.createdAt).toISOString().replace('T', ' ').slice(0, 19)} UTC
                </div>
              </button>
              {expanded === entry.id ? (
                <pre style={jsonStyle}>
                  {JSON.stringify(
                    { before: entry.beforeJson ?? null, after: entry.afterJson ?? null },
                    null,
                    2,
                  )}
                </pre>
              ) : null}
            </li>
          ))}
        </ul>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            disabled={offset <= 0}
            onClick={() => setOffset((v) => Math.max(0, v - limit))}
            style={btnStyle}
          >
            Previous
          </button>
          <button
            type="button"
            disabled={!data || offset + limit >= data.total}
            onClick={() => setOffset((v) => v + limit)}
            style={btnStyle}
          >
            Next
          </button>
        </div>
      </section>
    </AdminShell>
  );
}

const inputStyle: CSSProperties = {
  minWidth: 180,
  padding: '8px 10px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'inherit',
};

const btnStyle: CSSProperties = {
  padding: '8px 14px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'rgba(47, 111, 237, 0.18)',
  color: 'inherit',
  cursor: 'pointer',
};

const rowStyle: CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 10,
  background: 'rgba(26, 34, 44, 0.65)',
  overflow: 'hidden',
};

const rowBtn: CSSProperties = {
  width: '100%',
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  padding: '0.85rem 1rem',
  background: 'transparent',
  border: 'none',
  color: 'inherit',
  cursor: 'pointer',
  textAlign: 'left',
};

const jsonStyle: CSSProperties = {
  margin: 0,
  padding: '0.75rem 1rem 1rem',
  borderTop: '1px solid var(--border)',
  fontSize: 12,
  overflow: 'auto',
  color: '#c9d7ea',
};
