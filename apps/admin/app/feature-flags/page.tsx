'use client';

import { useCallback, useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import { AdminShell } from '../../components/AdminShell';
import { ApiError, apiFetch } from '../../lib/api';
import { loadSession } from '../../lib/session';

type FeatureFlag = {
  id: string;
  key: string;
  description: string | null;
  isEnabled: boolean;
  rulesJson: unknown;
  updatedAt: string;
};

export default function FeatureFlagsPage() {
  const [rows, setRows] = useState<FeatureFlag[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [key, setKey] = useState('identity.google_sign_in');
  const [description, setDescription] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const session = loadSession();
    if (!session) {
      return;
    }
    try {
      const data = await apiFetch<FeatureFlag[]>('/admin/configuration/feature-flags', {
        token: session.tokens.accessToken,
      });
      setRows(data);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load feature flags');
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
      await apiFetch('/admin/configuration/feature-flags', {
        method: 'PUT',
        token: session.tokens.accessToken,
        body: JSON.stringify({
          key,
          isEnabled,
          description: description || null,
        }),
      });
      await load();
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save feature flag');
    } finally {
      setSaving(false);
    }
  }

  async function toggle(flag: FeatureFlag) {
    const session = loadSession();
    if (!session) {
      return;
    }
    try {
      await apiFetch('/admin/configuration/feature-flags', {
        method: 'PUT',
        token: session.tokens.accessToken,
        body: JSON.stringify({
          key: flag.key,
          isEnabled: !flag.isEnabled,
          description: flag.description,
        }),
      });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to toggle feature flag');
    }
  }

  return (
    <AdminShell>
      <section style={{ maxWidth: 880, display: 'grid', gap: '1.5rem' }}>
        <header>
          <h2 style={{ margin: 0, fontSize: '1.8rem' }}>Feature flags</h2>
          <p style={{ margin: '0.4rem 0 0', color: 'var(--muted)' }}>
            Toggle capabilities without redeploying clients.
          </p>
        </header>

        {error ? <p style={{ color: '#f0b4b4', margin: 0 }}>{error}</p> : null}

        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {rows.map((row) => (
            <article key={row.id} style={rowStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <strong>{row.key}</strong>
                  {row.description ? (
                    <p style={{ margin: '0.35rem 0 0', color: 'var(--muted)', fontSize: 14 }}>
                      {row.description}
                    </p>
                  ) : null}
                </div>
                <button type="button" onClick={() => void toggle(row)} style={toggleStyle}>
                  {row.isEnabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>
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
              checked={isEnabled}
              onChange={(e) => setIsEnabled(e.target.checked)}
            />
            Enabled
          </label>
          <button type="submit" disabled={saving} style={buttonStyle}>
            {saving ? 'Saving…' : 'Save flag'}
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

const toggleStyle: CSSProperties = {
  alignSelf: 'start',
  background: 'transparent',
  border: '1px solid var(--border)',
  color: 'var(--text)',
  borderRadius: 8,
  padding: '0.4rem 0.7rem',
  cursor: 'pointer',
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
