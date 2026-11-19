'use client';

import { useCallback, useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import { AdminShell } from '../../components/AdminShell';
import { ApiError, apiFetch } from '../../lib/api';
import { loadSession } from '../../lib/session';

type RoleBrief = { code: string; name: string; assignedAt?: string };
type UserRow = {
  id: string;
  email: string | null;
  phoneE164: string | null;
  displayName: string | null;
  accountType: string;
  status: string;
  createdAt: string;
  roles: RoleBrief[];
};

type UsersPage = {
  page: number;
  pageSize: number;
  total: number;
  items: UserRow[];
};

type RoleCatalog = Array<{ code: string; name: string }>;

export default function UsersRolesPage() {
  const [data, setData] = useState<UsersPage | null>(null);
  const [roles, setRoles] = useState<RoleCatalog>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [roleCode, setRoleCode] = useState('');
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [assignRole, setAssignRole] = useState<Record<string, string>>({});
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
      if (q.trim()) {
        query.set('q', q.trim());
      }
      if (roleCode.trim()) {
        query.set('roleCode', roleCode.trim());
      }
      const [users, roleList] = await Promise.all([
        apiFetch<UsersPage>(`/admin/rbac/users?${query.toString()}`, {
          token: session.tokens.accessToken,
        }),
        apiFetch<RoleCatalog>('/admin/rbac/roles', {
          token: session.tokens.accessToken,
        }),
      ]);
      setData(users);
      setRoles(roleList.map((r) => ({ code: r.code, name: r.name })));
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load users');
    }
  }, [page, q, roleCode]);

  useEffect(() => {
    void load();
  }, [load]);

  function onSearch(event: FormEvent) {
    event.preventDefault();
    setPage(1);
    void load();
  }

  async function assign(userId: string) {
    const session = loadSession();
    if (!session) {
      return;
    }
    const code = (assignRole[userId] || roles[0]?.code || '').trim();
    if (!code) {
      setError('Select a role to assign');
      return;
    }
    setBusyId(userId);
    setMessage(null);
    try {
      await apiFetch(`/admin/rbac/users/${userId}/roles`, {
        method: 'POST',
        token: session.tokens.accessToken,
        body: JSON.stringify({ roleCode: code }),
      });
      setMessage(`Assigned ${code}`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Assign failed');
    } finally {
      setBusyId(null);
    }
  }

  async function revoke(userId: string, code: string) {
    const session = loadSession();
    if (!session) {
      return;
    }
    setBusyId(userId);
    setMessage(null);
    try {
      await apiFetch(`/admin/rbac/users/${userId}/roles/${code}`, {
        method: 'DELETE',
        token: session.tokens.accessToken,
      });
      setMessage(`Revoked ${code}`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Revoke failed');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminShell>
      <section style={{ maxWidth: 1040, display: 'grid', gap: '1.25rem' }}>
        <header>
          <h2 style={{ margin: 0, fontSize: '1.8rem' }}>Users & roles</h2>
          <p style={{ margin: '0.4rem 0 0', color: 'var(--muted)' }}>
            Search users and assign or revoke roles. Authorization is enforced by the API.
          </p>
        </header>

        <form onSubmit={onSearch} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search email, name, phone"
            style={inputStyle}
          />
          <select value={roleCode} onChange={(e) => setRoleCode(e.target.value)} style={inputStyle}>
            <option value="">All roles</option>
            {roles.map((role) => (
              <option key={role.code} value={role.code}>
                {role.name}
              </option>
            ))}
          </select>
          <button type="submit" style={btnStyle}>
            Search
          </button>
        </form>

        {error ? <p style={{ color: '#f0b4b4', margin: 0 }}>{error}</p> : null}
        {message ? <p style={{ color: '#9fd6b8', margin: 0 }}>{message}</p> : null}
        {data ? (
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13 }}>
            Page {data.page} · {data.total} users
          </p>
        ) : null}

        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 12 }}>
          {(data?.items ?? []).map((user) => (
            <li key={user.id} style={rowStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <strong>{user.displayName || user.email || user.phoneE164 || 'User'}</strong>
                  <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)', fontSize: 13 }}>
                    {user.email || '—'} · {user.status} · {user.accountType}
                  </p>
                </div>
                <code style={{ fontSize: 12 }}>{user.id.slice(0, 8)}</code>
              </div>

              <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {user.roles.length === 0 ? (
                  <span style={{ color: 'var(--muted)', fontSize: 13 }}>No roles</span>
                ) : (
                  user.roles.map((role) => (
                    <button
                      key={role.code}
                      type="button"
                      disabled={busyId === user.id}
                      onClick={() => void revoke(user.id, role.code)}
                      style={chipStyle}
                      title="Revoke role"
                    >
                      {role.code} ×
                    </button>
                  ))
                )}
              </div>

              <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <select
                  value={assignRole[user.id] ?? roles[0]?.code ?? ''}
                  onChange={(e) =>
                    setAssignRole((prev) => ({ ...prev, [user.id]: e.target.value }))
                  }
                  style={inputStyle}
                >
                  {roles.map((role) => (
                    <option key={role.code} value={role.code}>
                      {role.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={busyId === user.id}
                  onClick={() => void assign(user.id)}
                  style={btnStyle}
                >
                  Assign role
                </button>
              </div>
            </li>
          ))}
        </ul>

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

const inputStyle: CSSProperties = {
  minWidth: 160,
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
  padding: '1rem 1.1rem',
  background: 'rgba(26, 34, 44, 0.65)',
};

const chipStyle: CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 999,
  padding: '4px 10px',
  background: 'transparent',
  color: 'inherit',
  cursor: 'pointer',
  fontSize: 13,
};
