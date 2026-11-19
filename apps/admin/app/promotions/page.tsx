'use client';

import { useCallback, useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import { AdminShell } from '../../components/AdminShell';
import { ApiError, apiFetch } from '../../lib/api';
import { loadSession } from '../../lib/session';

type CountryBrief = { id: string; iso2: string; iso3: string };

type PricingRule = {
  id: string;
  countryId: string;
  currencyCode: string;
  placement: string;
  pricePerHour: string | number;
  maxSlots: number;
  defaultDurationHours: number;
  minDurationHours: number;
  maxDurationHours: number;
  rankWeight: number;
  isActive: boolean;
  country?: CountryBrief;
};

type PaymentRoute = {
  id: string;
  countryId: string;
  providerCode: string;
  priority: number;
  isActive: boolean;
  country?: CountryBrief;
};

type PublicCountry = { id: string; iso2: string; name?: string };

export default function PromotionsAdminPage() {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [routes, setRoutes] = useState<PaymentRoute[]>([]);
  const [countries, setCountries] = useState<PublicCountry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [countryId, setCountryId] = useState('');
  const [currencyCode, setCurrencyCode] = useState('SAR');
  const [placement, setPlacement] = useState('home');
  const [pricePerHour, setPricePerHour] = useState('2.5');
  const [maxSlots, setMaxSlots] = useState('7');
  const [defaultHours, setDefaultHours] = useState('24');

  const [routeCountryId, setRouteCountryId] = useState('');
  const [providerCode, setProviderCode] = useState('mock');
  const [priority, setPriority] = useState('10');

  const load = useCallback(async () => {
    const session = loadSession();
    if (!session) {
      return;
    }
    try {
      const [pricing, paymentRoutes, countryList] = await Promise.all([
        apiFetch<PricingRule[]>('/admin/commercial/pricing-rules', {
          token: session.tokens.accessToken,
        }),
        apiFetch<PaymentRoute[]>('/admin/commercial/payment-routes', {
          token: session.tokens.accessToken,
        }),
        apiFetch<PublicCountry[]>('/reference/countries'),
      ]);
      setRules(pricing);
      setRoutes(paymentRoutes);
      setCountries(countryList);
      if (!countryId && countryList[0]) {
        setCountryId(countryList[0].id);
      }
      if (!routeCountryId && countryList[0]) {
        setRouteCountryId(countryList[0].id);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load commercial settings');
    }
  }, [countryId, routeCountryId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSavePricing(event: FormEvent) {
    event.preventDefault();
    const session = loadSession();
    if (!session) {
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await apiFetch('/admin/commercial/pricing-rules', {
        method: 'PUT',
        token: session.tokens.accessToken,
        body: JSON.stringify({
          countryId,
          currencyCode,
          placement,
          pricePerHour: Number(pricePerHour),
          maxSlots: Number(maxSlots),
          defaultDurationHours: Number(defaultHours),
          minDurationHours: 1,
          maxDurationHours: 168,
          isActive: true,
        }),
      });
      setMessage('Pricing rule saved');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save pricing rule');
    } finally {
      setSaving(false);
    }
  }

  async function onSaveRoute(event: FormEvent) {
    event.preventDefault();
    const session = loadSession();
    if (!session) {
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await apiFetch('/admin/commercial/payment-routes', {
        method: 'PUT',
        token: session.tokens.accessToken,
        body: JSON.stringify({
          countryId: routeCountryId,
          providerCode,
          priority: Number(priority),
          isActive: true,
        }),
      });
      setMessage('Payment route saved');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save payment route');
    } finally {
      setSaving(false);
    }
  }

  async function onExpireDue() {
    const session = loadSession();
    if (!session) {
      return;
    }
    try {
      const result = await apiFetch<{ expiredCount: number }>(
        '/admin/commercial/promotions/expire-due',
        {
          method: 'POST',
          token: session.tokens.accessToken,
        },
      );
      setMessage(`Expired ${result.expiredCount} promotion(s)`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Expiry job failed');
    }
  }

  return (
    <AdminShell>
      <section style={{ maxWidth: 960, display: 'grid', gap: '1.75rem' }}>
        <header>
          <h2 style={{ margin: 0, fontSize: '1.8rem' }}>Featured pricing & payments</h2>
          <p style={{ margin: '0.4rem 0 0', color: 'var(--muted)' }}>
            Admin-configurable hourly featured plans and country payment provider routing (mock for
            local).
          </p>
        </header>

        {error ? <p style={{ color: '#f0b4b4', margin: 0 }}>{error}</p> : null}
        {message ? <p style={{ color: '#9ad7b3', margin: 0 }}>{message}</p> : null}

        <div style={{ display: 'flex', gap: 12 }}>
          <button type="button" style={btnStyle} onClick={() => void onExpireDue()}>
            Run expiry job
          </button>
        </div>

        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <h3 style={{ margin: 0 }}>Pricing rules</h3>
          {rules.map((rule) => (
            <article key={rule.id} style={rowStyle}>
              <strong>
                {rule.country?.iso2 ?? rule.countryId} · {rule.placement} · {rule.currencyCode}
              </strong>
              <p style={{ margin: '0.35rem 0 0', color: 'var(--muted)', fontSize: 14 }}>
                {String(rule.pricePerHour)} / hour · slots {rule.maxSlots} · default{' '}
                {rule.defaultDurationHours}h · {rule.isActive ? 'active' : 'inactive'}
              </p>
            </article>
          ))}
        </div>

        <form onSubmit={onSavePricing} style={formStyle}>
          <h3 style={{ margin: 0 }}>Upsert pricing rule</h3>
          <label style={labelStyle}>
            Country
            <select
              value={countryId}
              onChange={(e) => setCountryId(e.target.value)}
              style={inputStyle}
            >
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.iso2} {c.name ?? ''}
                </option>
              ))}
            </select>
          </label>
          <label style={labelStyle}>
            Placement
            <input
              value={placement}
              onChange={(e) => setPlacement(e.target.value)}
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            Currency
            <input
              value={currencyCode}
              onChange={(e) => setCurrencyCode(e.target.value.toUpperCase())}
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            Price per hour
            <input
              value={pricePerHour}
              onChange={(e) => setPricePerHour(e.target.value)}
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            Max slots
            <input
              value={maxSlots}
              onChange={(e) => setMaxSlots(e.target.value)}
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            Default hours
            <input
              value={defaultHours}
              onChange={(e) => setDefaultHours(e.target.value)}
              style={inputStyle}
            />
          </label>
          <button type="submit" disabled={saving} style={btnStyle}>
            {saving ? 'Saving…' : 'Save pricing'}
          </button>
        </form>

        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <h3 style={{ margin: 0 }}>Payment provider routes</h3>
          {routes.map((route) => (
            <article key={route.id} style={rowStyle}>
              <strong>
                {route.country?.iso2 ?? route.countryId} → {route.providerCode}
              </strong>
              <p style={{ margin: '0.35rem 0 0', color: 'var(--muted)', fontSize: 14 }}>
                priority {route.priority} · {route.isActive ? 'active' : 'inactive'}
              </p>
            </article>
          ))}
        </div>

        <form onSubmit={onSaveRoute} style={formStyle}>
          <h3 style={{ margin: 0 }}>Upsert payment route</h3>
          <label style={labelStyle}>
            Country
            <select
              value={routeCountryId}
              onChange={(e) => setRouteCountryId(e.target.value)}
              style={inputStyle}
            >
              {countries.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.iso2} {c.name ?? ''}
                </option>
              ))}
            </select>
          </label>
          <label style={labelStyle}>
            Provider code
            <input
              value={providerCode}
              onChange={(e) => setProviderCode(e.target.value)}
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            Priority (lower = higher)
            <input
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              style={inputStyle}
            />
          </label>
          <button type="submit" disabled={saving} style={btnStyle}>
            {saving ? 'Saving…' : 'Save route'}
          </button>
        </form>
      </section>
    </AdminShell>
  );
}

const rowStyle: CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 10,
  padding: '0.85rem 1rem',
  background: 'rgba(255,255,255,0.02)',
};

const formStyle: CSSProperties = {
  display: 'grid',
  gap: '0.75rem',
  borderTop: '1px solid var(--border)',
  paddingTop: '1rem',
};

const labelStyle: CSSProperties = {
  display: 'grid',
  gap: 6,
  fontSize: 14,
};

const inputStyle: CSSProperties = {
  padding: '0.55rem 0.7rem',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'rgba(0,0,0,0.25)',
  color: 'inherit',
};

const btnStyle: CSSProperties = {
  justifySelf: 'start',
  padding: '0.6rem 1rem',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--accent, #2f6fed)',
  color: '#fff',
  cursor: 'pointer',
};
