'use client';

import { useCallback, useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import { AdminShell } from '../../components/AdminShell';
import { ApiError, apiFetch } from '../../lib/api';
import { loadSession } from '../../lib/session';

type CountryRow = {
  id: string;
  iso2: string;
  iso3: string;
  isActive?: boolean;
  dialingCode?: string | null;
  defaultCurrencyCode?: string | null;
  name?: string;
};

export default function ReferenceAdminPage() {
  const [countries, setCountries] = useState<CountryRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [iso2, setIso2] = useState('');
  const [iso3, setIso3] = useState('');
  const [dialingCode, setDialingCode] = useState('+');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const session = loadSession();
    if (!session) {
      return;
    }
    try {
      const data = await apiFetch<CountryRow[]>('/admin/reference/countries', {
        token: session.tokens.accessToken,
      });
      setCountries(data);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load reference countries');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    const session = loadSession();
    if (!session) {
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await apiFetch('/admin/reference/countries', {
        method: 'POST',
        token: session.tokens.accessToken,
        body: JSON.stringify({
          iso2: iso2.trim().toUpperCase(),
          iso3: iso3.trim().toUpperCase(),
          dialingCode: dialingCode.trim(),
          isActive: true,
        }),
      });
      setIso2('');
      setIso3('');
      setDialingCode('+');
      setMessage('Country created');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Create failed');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(country: CountryRow) {
    const session = loadSession();
    if (!session) {
      return;
    }
    setMessage(null);
    try {
      await apiFetch(`/admin/reference/countries/${country.id}`, {
        method: 'PATCH',
        token: session.tokens.accessToken,
        body: JSON.stringify({ isActive: !(country.isActive ?? true) }),
      });
      setMessage(`Updated ${country.iso2}`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Update failed');
    }
  }

  return (
    <AdminShell>
      <section style={{ maxWidth: 960, display: 'grid', gap: '1.25rem' }}>
        <header>
          <h2 style={{ margin: 0, fontSize: '1.8rem' }}>Reference data</h2>
          <p style={{ margin: '0.4rem 0 0', color: 'var(--muted)' }}>
            Country catalog for multi-country ops. Associations (language/currency/TZ) remain the
            source of truth via admin APIs.
          </p>
        </header>

        <form onSubmit={onCreate} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            value={iso2}
            onChange={(e) => setIso2(e.target.value)}
            placeholder="ISO2"
            maxLength={2}
            required
            style={inputStyle}
          />
          <input
            value={iso3}
            onChange={(e) => setIso3(e.target.value)}
            placeholder="ISO3"
            maxLength={3}
            required
            style={inputStyle}
          />
          <input
            value={dialingCode}
            onChange={(e) => setDialingCode(e.target.value)}
            placeholder="Dialing e.g. +966"
            required
            style={inputStyle}
          />
          <button type="submit" disabled={saving} style={btnStyle}>
            Add country
          </button>
        </form>

        {error ? <p style={{ color: '#f0b4b4', margin: 0 }}>{error}</p> : null}
        {message ? <p style={{ color: '#9fd6b8', margin: 0 }}>{message}</p> : null}

        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
          {countries.map((country) => (
            <li key={country.id} style={rowStyle}>
              <div>
                <strong>
                  {country.iso2} / {country.iso3}
                </strong>
                <span style={{ marginLeft: 8, color: 'var(--muted)', fontSize: 13 }}>
                  {country.isActive === false ? 'inactive' : 'active'}
                </span>
              </div>
              <button type="button" onClick={() => void toggleActive(country)} style={btnStyle}>
                {country.isActive === false ? 'Activate' : 'Deactivate'}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </AdminShell>
  );
}

const inputStyle: CSSProperties = {
  minWidth: 100,
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
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  borderTop: '1px solid var(--border)',
  paddingTop: 10,
};
