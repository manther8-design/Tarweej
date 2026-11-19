'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import { AdminShell } from '../../components/AdminShell';
import { ApiError, apiFetch } from '../../lib/api';
import { loadSession } from '../../lib/session';

type CategoryRow = {
  id: string;
  parentId: string | null;
  slug: string;
  name: string;
  listingType: string;
  sortOrder: number;
  isActive: boolean;
  _count?: { children: number; attributes: number };
};

type AttributeRow = {
  id: string;
  code: string;
  name: string;
  dataType: string;
  unit: string | null;
  isRequired: boolean;
  sortOrder: number;
  isActive: boolean;
  options: Array<{ id: string; value: string; label: string }>;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [attributes, setAttributes] = useState<AttributeRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [saving, setSaving] = useState(false);

  const [attrCode, setAttrCode] = useState('');
  const [attrName, setAttrName] = useState('');
  const [attrType, setAttrType] = useState('text');
  const [attrRequired, setAttrRequired] = useState(false);
  const [attachCategoryId, setAttachCategoryId] = useState('');
  const [attachAttributeId, setAttachAttributeId] = useState('');

  const load = useCallback(async () => {
    const session = loadSession();
    if (!session) {
      return;
    }
    try {
      const [cats, attrs] = await Promise.all([
        apiFetch<CategoryRow[]>('/admin/categories', {
          token: session.tokens.accessToken,
        }),
        apiFetch<AttributeRow[]>('/admin/categories/attributes', {
          token: session.tokens.accessToken,
        }),
      ]);
      setCategories(cats);
      setAttributes(attrs);
      setError(null);
      setAttachCategoryId((current) => current || cats[0]?.id || '');
      setAttachAttributeId((current) => current || attrs[0]?.id || '');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load catalog');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreateCategory(event: FormEvent) {
    event.preventDefault();
    const session = loadSession();
    if (!session) {
      return;
    }
    setSaving(true);
    try {
      await apiFetch('/admin/categories', {
        method: 'POST',
        token: session.tokens.accessToken,
        body: JSON.stringify({
          slug,
          name,
          parentId: parentId || null,
          sortOrder: Number(sortOrder) || 0,
          translations: { en: name },
        }),
      });
      setSlug('');
      setName('');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create category');
    } finally {
      setSaving(false);
    }
  }

  async function onCreateAttribute(event: FormEvent) {
    event.preventDefault();
    const session = loadSession();
    if (!session) {
      return;
    }
    setSaving(true);
    try {
      await apiFetch('/admin/categories/attributes', {
        method: 'POST',
        token: session.tokens.accessToken,
        body: JSON.stringify({
          code: attrCode,
          name: attrName,
          dataType: attrType,
          isRequired: attrRequired,
        }),
      });
      setAttrCode('');
      setAttrName('');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create attribute');
    } finally {
      setSaving(false);
    }
  }

  async function onAttach(event: FormEvent) {
    event.preventDefault();
    const session = loadSession();
    if (!session || !attachCategoryId || !attachAttributeId) {
      return;
    }
    setSaving(true);
    try {
      await apiFetch(`/admin/categories/${attachCategoryId}/attributes`, {
        method: 'POST',
        token: session.tokens.accessToken,
        body: JSON.stringify({
          attributeDefinitionId: attachAttributeId,
          sortOrder: 0,
        }),
      });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to attach attribute');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(category: CategoryRow) {
    const session = loadSession();
    if (!session) {
      return;
    }
    try {
      await apiFetch(`/admin/categories/${category.id}`, {
        method: 'PATCH',
        token: session.tokens.accessToken,
        body: JSON.stringify({ isActive: !category.isActive }),
      });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update category');
    }
  }

  return (
    <AdminShell>
      <section style={{ maxWidth: 960, display: 'grid', gap: '1.75rem' }}>
        <header>
          <h2 style={{ margin: 0, fontSize: '1.8rem' }}>Categories & attributes</h2>
          <p style={{ margin: '0.4rem 0 0', color: 'var(--muted)' }}>
            Admin-managed catalog hierarchy. Public clients read{' '}
            <code style={{ color: 'var(--text)' }}>/api/v1/categories</code>.
          </p>
        </header>

        {error ? <p style={{ color: '#f0b4b4', margin: 0 }}>{error}</p> : null}

        <div style={{ display: 'grid', gap: '0.65rem' }}>
          <h3 style={{ margin: 0 }}>Categories</h3>
          {categories.map((row) => (
            <article key={row.id} style={rowStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <strong>{row.name}</strong>
                  <span style={{ color: 'var(--muted)', marginInlineStart: 8 }}>{row.slug}</span>
                </div>
                <button type="button" onClick={() => void toggleActive(row)} style={ghostButton}>
                  {row.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
              <p style={{ margin: '0.4rem 0 0', color: 'var(--muted)', fontSize: 13 }}>
                type={row.listingType} · sort={row.sortOrder} · children=
                {row._count?.children ?? 0} · attrs={row._count?.attributes ?? 0}
                {row.parentId ? (
                  <>
                    {' '}
                    · parent=<code>{row.parentId.slice(0, 8)}</code>
                  </>
                ) : null}
              </p>
              <p style={{ margin: '0.35rem 0 0' }}>
                <Link href={`/categories/${row.id}`} style={{ color: 'var(--accent)' }}>
                  Edit / manage attributes →
                </Link>
              </p>
            </article>
          ))}
        </div>

        <form onSubmit={(e) => void onCreateCategory(e)} style={formStyle}>
          <h3 style={{ margin: 0 }}>Create category</h3>
          <label style={labelStyle}>
            Slug
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              style={inputStyle}
              required
            />
          </label>
          <label style={labelStyle}>
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
              required
            />
          </label>
          <label style={labelStyle}>
            Parent (optional)
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              style={inputStyle}
            >
              <option value="">— root —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.slug})
                </option>
              ))}
            </select>
          </label>
          <label style={labelStyle}>
            Sort order
            <input
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              style={inputStyle}
              inputMode="numeric"
            />
          </label>
          <button type="submit" disabled={saving} style={buttonStyle}>
            {saving ? 'Saving…' : 'Create category'}
          </button>
        </form>

        <div style={{ display: 'grid', gap: '0.65rem' }}>
          <h3 style={{ margin: 0 }}>Attribute definitions</h3>
          {attributes.map((row) => (
            <article key={row.id} style={rowStyle}>
              <strong>
                {row.name} <span style={{ color: 'var(--muted)' }}>({row.code})</span>
              </strong>
              <p style={{ margin: '0.35rem 0 0', color: 'var(--muted)', fontSize: 13 }}>
                {row.dataType}
                {row.unit ? ` · ${row.unit}` : ''} · {row.isRequired ? 'required' : 'optional'} ·
                options={row.options?.length ?? 0}
              </p>
            </article>
          ))}
        </div>

        <form onSubmit={(e) => void onCreateAttribute(e)} style={formStyle}>
          <h3 style={{ margin: 0 }}>Create attribute</h3>
          <label style={labelStyle}>
            Code
            <input
              value={attrCode}
              onChange={(e) => setAttrCode(e.target.value)}
              style={inputStyle}
              required
            />
          </label>
          <label style={labelStyle}>
            Name
            <input
              value={attrName}
              onChange={(e) => setAttrName(e.target.value)}
              style={inputStyle}
              required
            />
          </label>
          <label style={labelStyle}>
            Data type
            <select
              value={attrType}
              onChange={(e) => setAttrType(e.target.value)}
              style={inputStyle}
            >
              {[
                'text',
                'number',
                'int',
                'decimal',
                'single_select',
                'multi_select',
                'bool',
                'date',
                'numeric_range',
                'unit',
              ].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--muted)' }}>
            <input
              type="checkbox"
              checked={attrRequired}
              onChange={(e) => setAttrRequired(e.target.checked)}
            />
            Required by default
          </label>
          <button type="submit" disabled={saving} style={buttonStyle}>
            {saving ? 'Saving…' : 'Create attribute'}
          </button>
        </form>

        <form onSubmit={(e) => void onAttach(e)} style={formStyle}>
          <h3 style={{ margin: 0 }}>Attach attribute to category</h3>
          <label style={labelStyle}>
            Category
            <select
              value={attachCategoryId}
              onChange={(e) => setAttachCategoryId(e.target.value)}
              style={inputStyle}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label style={labelStyle}>
            Attribute
            <select
              value={attachAttributeId}
              onChange={(e) => setAttachAttributeId(e.target.value)}
              style={inputStyle}
            >
              {attributes.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.code})
                </option>
              ))}
            </select>
          </label>
          <button type="submit" disabled={saving} style={buttonStyle}>
            {saving ? 'Saving…' : 'Attach'}
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

const ghostButton: CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--border)',
  color: 'var(--text)',
  borderRadius: 8,
  padding: '0.35rem 0.65rem',
  cursor: 'pointer',
  fontSize: 13,
};
