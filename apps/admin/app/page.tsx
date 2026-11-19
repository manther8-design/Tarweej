'use client';

import { AdminShell } from '../components/AdminShell';

export default function AdminHomePage() {
  return (
    <AdminShell>
      <section style={{ maxWidth: 720 }}>
        <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.8rem' }}>Admin foundation</h2>
        <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.55 }}>
          Manage catalog categories, listing moderation, featured pricing, payment routes, business
          settings, feature flags, and role permissions.
        </p>
        <ul
          style={{
            margin: '1.5rem 0 0',
            padding: 0,
            listStyle: 'none',
            display: 'grid',
            gap: '0.75rem',
          }}
        >
          {[
            ['Categories', 'Hierarchy and dynamic attributes CRUD (audited).'],
            ['Listings', 'Pending review queue — approve/reject with audit trail.'],
            ['Promotions', 'Featured hourly pricing rules and country payment routing.'],
            ['Settings', 'Read and update typed business settings (audited).'],
            ['Feature flags', 'Toggle client-facing capability flags.'],
            ['Roles', 'Inspect seeded roles and their permission grants.'],
          ].map(([title, copy]) => (
            <li
              key={title}
              style={{
                borderTop: '1px solid var(--border)',
                paddingTop: '0.75rem',
              }}
            >
              <strong style={{ display: 'block', marginBottom: 4 }}>{title}</strong>
              <span style={{ color: 'var(--muted)' }}>{copy}</span>
            </li>
          ))}
        </ul>
      </section>
    </AdminShell>
  );
}
