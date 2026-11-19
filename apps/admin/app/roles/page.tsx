'use client';

import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { AdminShell } from '../../components/AdminShell';
import { ApiError, apiFetch } from '../../lib/api';
import { loadSession } from '../../lib/session';

type RoleView = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  assignmentCount: number;
  permissions: Array<{ code: string; name: string; description: string | null }>;
};

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleView[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const session = loadSession();
    if (!session) {
      return;
    }
    try {
      const data = await apiFetch<RoleView[]>('/admin/rbac/roles', {
        token: session.tokens.accessToken,
      });
      setRoles(data);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load roles');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AdminShell>
      <section style={{ maxWidth: 920, display: 'grid', gap: '1.5rem' }}>
        <header>
          <h2 style={{ margin: 0, fontSize: '1.8rem' }}>Roles & permissions</h2>
          <p style={{ margin: '0.4rem 0 0', color: 'var(--muted)' }}>
            Overview of seeded roles. Assignments are enforced by the API, not this UI alone.
          </p>
        </header>

        {error ? <p style={{ color: '#f0b4b4', margin: 0 }}>{error}</p> : null}

        <div style={{ display: 'grid', gap: '1rem' }}>
          {roles.map((role) => (
            <article key={role.id} style={rowStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <h3 style={{ margin: 0 }}>{role.name}</h3>
                  <p style={{ margin: '0.25rem 0 0', color: 'var(--muted)', fontSize: 14 }}>
                    <code>{role.code}</code>
                    {role.description ? ` · ${role.description}` : ''}
                  </p>
                </div>
                <span style={{ color: 'var(--muted)', fontSize: 13 }}>
                  {role.assignmentCount} assignment{role.assignmentCount === 1 ? '' : 's'}
                </span>
              </div>
              <ul
                style={{
                  margin: '0.9rem 0 0',
                  padding: 0,
                  listStyle: 'none',
                  display: 'grid',
                  gap: 6,
                }}
              >
                {role.permissions.length === 0 ? (
                  <li style={{ color: 'var(--muted)', fontSize: 14 }}>No permissions granted</li>
                ) : (
                  role.permissions.map((permission) => (
                    <li key={permission.code} style={{ fontSize: 14 }}>
                      <code style={{ color: '#c9d7ea' }}>{permission.code}</code>
                      <span style={{ color: 'var(--muted)' }}> — {permission.name}</span>
                    </li>
                  ))
                )}
              </ul>
            </article>
          ))}
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
