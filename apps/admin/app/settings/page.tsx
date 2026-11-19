'use client';

import { useCallback, useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import { AdminShell } from '../../components/AdminShell';
import { ApiError, apiFetch } from '../../lib/api';
import { loadSession } from '../../lib/session';

type Setting = {
  id: string;
  key: string;
  description: string | null;
  valueJson: unknown;
  isSecret: boolean;
  updatedAt: string;
};

export default function SettingsPage() {
  const [rows, setRows] = useState<Setting[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [key, setKey] = useState('listings.featured_home_count');
  const [valueText, setValueText] = useState('{"count":7}');
  const [description, setDescription] = useState('');
  const [isSecret, setIsSecret] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const session = loadSession();
    if (!session) {
      return;
    }
    try {
      const data = await apiFetch<Setting[]>('/admin/configuration/settings', {
        token: session.tokens.accessToken,
      });
      setRows(data);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load settings');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSave(event: FormEvent) {
    event.preventDefault();
    const session = loadSession();
    if (!session) {
      return;
    }
    setSaving(true);
    try {
      const valueJson = JSON.parse(valueText) as Record<string, unknown>;
      await apiFetch('/admin/configuration/settings', {
        method: 'PUT',
        token: session.tokens.accessToken,
        body: JSON.stringify({
          key,
          valueJson,
          description: description || null,
          isSecret,
        }),
      });
      await load();
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save setting');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell>
      <section style={{ maxWidth: 880, display: 'grid', gap: '1.5rem' }}>
        <header>
          <h2 style={{ margin: 0, fontSize: '1.8rem' }}>Business settings</h2>
          <p style={{ margin: '0.4rem 0 0', color: 'var(--muted)' }}>
            Admin-managed configuration. Secrets stay off public client endpoints.
          </p>
        </header>

        {error ? <p style={{ color: '#f0b4b4', margin: 0 }}>{error}</p> : null}

        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {rows.map((row) => (
            <article key={row.id} style={rowStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <strong>{row.key}</strong>
                {row.isSecret ? <span style={badgeStyle}>secret</span> : null}
              </div>
              {row.description ? (
                <p style={{ margin: '0.35rem 0 0', color: 'var(--muted)', fontSize: 14 }}>
                  {row.description}
                </p>
              ) : null}
              <pre style={preStyle}>{JSON.stringify(row.valueJson, null, 2)}</pre>
            </article>
          ))}
        </div>

        <form onSubmit={(e) => void onSave(e)} style={formStyle}>
          <h3 style={{ margin: 0 }}>Create / update</h3>
          <label style={labelStyle}>
            Key
            <input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              style={inputStyle}
              required
            />
          </label>
          <label style={labelStyle}>
            Value JSON
            <textarea
              value={valueText}
              onChange={(e) => setValueText(e.target.value)}
              style={{ ...inputStyle, minHeight: 96, fontFamily: 'ui-monospace, monospace' }}
              required
            />
          </label>
          <label style={labelStyle}>
            Description
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={inputStyle}
            />
          </label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--muted)' }}>
            <input
              type="checkbox"
              checked={isSecret}
              onChange={(e) => setIsSecret(e.target.checked)}
            />
            Mark as secret
          </label>
          <button type="submit" disabled={saving} style={buttonStyle}>
            {saving ? 'Saving…' : 'Save setting'}
          </button>
        </form>
      </section>
    </AdminShell>
  );
}

const rowStyle: CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 10,
  padding: '0.9rem 1rem',
  background: 'rgba(26, 34, 44, 0.65)',
};

const badgeStyle: CSSProperties = {
  fontSize: 12,
  color: '#f0d9a8',
  border: '1px solid #5a4a28',
  borderRadius: 6,
  padding: '0.15rem 0.45rem',
  alignSelf: 'start',
};

const preStyle: CSSProperties = {
  margin: '0.65rem 0 0',
  padding: '0.65rem 0.75rem',
  background: '#0f1419',
  borderRadius: 8,
  overflow: 'auto',
  fontSize: 13,
};

const formStyle: CSSProperties = {
  display: 'grid',
  gap: '0.75rem',
  borderTop: '1px solid var(--border)',
  paddingTop: '1.25rem',
};

const labelStyle: CSSProperties = { display: 'grid', gap: 6, fontSize: 14, color: 'var(--muted)' };

const inputStyle: CSSProperties = {
  background: '#0f1419',
  border: '1px solid var(--border)',
  borderRadius: 8,
  color: 'var(--text)',
  padding: '0.65rem 0.75rem',
  fontSize: 15,
};

const buttonStyle: CSSProperties = {
  justifySelf: 'start',
  background: 'var(--accent)',
  color: '#fff',
  border: 0,
  borderRadius: 8,
  padding: '0.7rem 1rem',
  fontWeight: 600,
  cursor: 'pointer',
};
