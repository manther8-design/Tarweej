'use client';

import { useState, type CSSProperties, type FormEvent } from 'react';

/**
 * Login placeholder only — Identity E2E (OTP/Google/sessions) is Phase 2.
 */
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setMessage('Auth is not wired yet. This is a Phase 1 UI placeholder for the admin shell.');
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '2rem',
      }}
    >
      <form
        onSubmit={onSubmit}
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '1.75rem',
          display: 'grid',
          gap: '0.9rem',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '1.6rem' }}>Admin login</h1>
          <p style={{ margin: '0.4rem 0 0', color: 'var(--muted)' }}>ترويج · placeholder only</p>
        </div>

        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 14, color: 'var(--muted)' }}>Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            autoComplete="username"
          />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontSize: 14, color: 'var(--muted)' }}>Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            autoComplete="current-password"
          />
        </label>

        <button
          type="submit"
          style={{
            marginTop: 4,
            background: 'var(--accent)',
            color: '#fff',
            border: 0,
            borderRadius: 8,
            padding: '0.75rem 1rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Sign in
        </button>

        {message ? (
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14 }}>{message}</p>
        ) : null}
      </form>
    </main>
  );
}

const inputStyle: CSSProperties = {
  background: '#0f1419',
  border: '1px solid var(--border)',
  borderRadius: 8,
  color: 'var(--text)',
  padding: '0.7rem 0.8rem',
  fontSize: 16,
};
