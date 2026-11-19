'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import { AdminShell } from '../../../components/AdminShell';
import { ApiError, apiFetch } from '../../../lib/api';
import { loadSession } from '../../../lib/session';

type CategoryDetail = {
  id: string;
  slug: string;
  name: string;
  listingType: string;
  sortOrder: number;
  isActive: boolean;
  parentId: string | null;
  attributes: Array<{
    id: string;
    sortOrder: number;
    isRequiredOverride: boolean | null;
    isActive: boolean;
    attributeDefinition: {
      id: string;
      code: string;
      name: string;
      dataType: string;
      isRequired: boolean;
      options: Array<{ id: string; value: string; label: string }>;
    };
  }>;
};

export default function CategoryEditPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [detail, setDetail] = useState<CategoryDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const session = loadSession();
    if (!session || !id) {
      return;
    }
    try {
      const data = await apiFetch<CategoryDetail>(`/admin/categories/${id}`, {
        token: session.tokens.accessToken,
      });
      setDetail(data);
      setName(data.name);
      setSlug(data.slug);
      setSortOrder(String(data.sortOrder));
      setIsActive(data.isActive);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load category');
    }
  }, [id]);

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
      await apiFetch(`/admin/categories/${id}`, {
        method: 'PATCH',
        token: session.tokens.accessToken,
        body: JSON.stringify({
          name,
          slug,
          sortOrder: Number(sortOrder) || 0,
          isActive,
          translations: { en: name },
        }),
      });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save category');
    } finally {
      setSaving(false);
    }
  }

  async function detach(linkId: string) {
    const session = loadSession();
    if (!session) {
      return;
    }
    try {
      await apiFetch(`/admin/categories/attribute-links/${linkId}`, {
        method: 'DELETE',
        token: session.tokens.accessToken,
      });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to detach attribute');
    }
  }

  return (
    <AdminShell>
      <section style={{ maxWidth: 880, display: 'grid', gap: '1.5rem' }}>
        <header>
          <p style={{ margin: 0 }}>
            <Link href="/categories" style={{ color: 'var(--accent)' }}>
              ← Categories
            </Link>
          </p>
          <h2 style={{ margin: '0.5rem 0 0', fontSize: '1.8rem' }}>
            {detail?.name ?? 'Edit category'}
          </h2>
        </header>

        {error ? <p style={{ color: '#f0b4b4', margin: 0 }}>{error}</p> : null}

        {detail ? (
          <>
            <form onSubmit={(e) => void onSave(e)} style={formStyle}>
              <label style={labelStyle}>
                Name
                <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
              </label>
              <label style={labelStyle}>
                Slug
                <input value={slug} onChange={(e) => setSlug(e.target.value)} style={inputStyle} />
              </label>
              <label style={labelStyle}>
                Sort order
                <input
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  style={inputStyle}
                />
              </label>
              <label
                style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--muted)' }}
              >
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                Active
              </label>
              <button type="submit" disabled={saving} style={buttonStyle}>
                {saving ? 'Saving…' : 'Save category'}
              </button>
            </form>

            <div style={{ display: 'grid', gap: '0.65rem' }}>
              <h3 style={{ margin: 0 }}>Attached attributes</h3>
              {detail.attributes.length === 0 ? (
                <p style={{ color: 'var(--muted)' }}>No attributes attached.</p>
              ) : (
                detail.attributes.map((link) => (
                  <article key={link.id} style={rowStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <div>
                        <strong>{link.attributeDefinition.name}</strong>
                        <span style={{ color: 'var(--muted)', marginInlineStart: 8 }}>
                          {link.attributeDefinition.code} · {link.attributeDefinition.dataType}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => void detach(link.id)}
                        style={ghostButton}
                      >
                        Detach
                      </button>
                    </div>
                    <p style={{ margin: '0.35rem 0 0', color: 'var(--muted)', fontSize: 13 }}>
                      required=
                      {String(link.isRequiredOverride ?? link.attributeDefinition.isRequired)} ·
                      sort={link.sortOrder} · options=
                      {link.attributeDefinition.options.map((o) => o.label).join(', ') || '—'}
                    </p>
                  </article>
                ))
              )}
            </div>
          </>
        ) : (
          <p style={{ color: 'var(--muted)' }}>Loading…</p>
        )}
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

const formStyle: CSSProperties = {
  display: 'grid',
  gap: '0.75rem',
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

const ghostButton: CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--border)',
  color: 'var(--text)',
  borderRadius: 8,
  padding: '0.35rem 0.65rem',
  cursor: 'pointer',
  fontSize: 13,
};
