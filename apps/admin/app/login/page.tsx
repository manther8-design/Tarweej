'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import { ApiError, login } from '../../lib/api';
import { hasAdminAccess, loadSession, saveSession } from '../../lib/session';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@tarweej.local');
  const [password, setPassword] = useState('Admin123!');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const session = loadSession();
    if (session && hasAdminAccess(session.user)) {
      router.replace('/');
    }
  }, [router]);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const result = await login(email.trim(), password);
      if (!hasAdminAccess(result.user)) {
        setMessage('This account has no admin permissions.');
        return;
      }
      saveSession({ user: result.user, tokens: result.tokens });
      router.replace('/');
    } catch (error) {
      const text =
        error instanceof ApiError ? error.message : 'Unable to sign in. Check API availability.';
      setMessage(text);
    } finally {
      setBusy(false);
    }
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
        onSubmit={(e) => void onSubmit(e)}
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
          <p style={{ margin: 0, color: 'var(--muted)', letterSpacing: '0.08em', fontSize: 12 }}>
            ترويج · ADMIN
          </p>
          <h1 style={{ margin: '0.35rem 0 0', fontSize: '1.7rem' }}>Admin login</h1>
          <p style={{ margin: '0.4rem 0 0', color: 'var(--muted)' }}>
            Sign in against the Tarweej API with an elevated role.
          </p>
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
          disabled={busy}
          style={{
            marginTop: 4,
            background: 'var(--accent)',
            color: '#fff',
            border: 0,
            borderRadius: 8,
            padding: '0.75rem 1rem',
            fontWeight: 600,
            cursor: busy ? 'wait' : 'pointer',
            opacity: busy ? 0.75 : 1,
          }}
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>

        {message ? <p style={{ margin: 0, color: '#f0b4b4', fontSize: 14 }}>{message}</p> : null}
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
