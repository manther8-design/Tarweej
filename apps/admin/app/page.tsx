import Link from 'next/link';

export default function AdminHomePage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '2rem',
      }}
    >
      <section style={{ maxWidth: 480, width: '100%' }}>
        <p style={{ color: 'var(--muted)', letterSpacing: '0.08em', marginBottom: 8 }}>ADMIN</p>
        <h1 style={{ fontSize: '2.4rem', margin: '0 0 0.5rem' }}>ترويج</h1>
        <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>
          Tarweej admin shell — login placeholder only (Phase 1).
        </p>
        <Link
          href="/login"
          style={{
            display: 'inline-block',
            background: 'var(--accent)',
            color: '#fff',
            padding: '0.75rem 1.25rem',
            borderRadius: 8,
            fontWeight: 600,
          }}
        >
          Go to login
        </Link>
      </section>
    </main>
  );
}
