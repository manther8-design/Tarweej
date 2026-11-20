'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { ApiError, login } from '../../lib/api';
import { loadSession, saveSession } from '../../lib/session';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('seller@tarweej.local');
  const [password, setPassword] = useState('Seller123!');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const session = loadSession();
    if (session?.tokens.accessToken) {
      router.replace('/dashboard');
    }
  }, [router]);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const result = await login(email.trim(), password);
      saveSession({ user: result.user, tokens: result.tokens });
      router.replace('/dashboard/listings');
    } catch (error) {
      const text =
        error instanceof ApiError
          ? error.message
          : 'تعذّر تسجيل الدخول. تأكد من تشغيل واجهة الهوية.';
      setMessage(text);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 480, margin: '2rem auto 3rem' }}>
      <section className="panel">
        <h1 style={{ marginTop: 0 }}>دخول ترويج</h1>
        <p style={{ color: 'var(--muted)' }}>
          سجّل الدخول عبر واجهة الهوية{' '}
          <span className="en" style={{ fontFamily: 'var(--font-en)' }}>
            POST /identity/auth/login
          </span>
          . تُحفظ الجلسة محلياً ويُرسل رمز الوصول في ترويسة Authorization.
        </p>
        <form onSubmit={(e) => void onSubmit(e)}>
          <label style={{ display: 'grid', gap: 6, marginBottom: 12 }}>
            البريد
            <input
              className="field"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seller@tarweej.local"
            />
          </label>
          <label style={{ display: 'grid', gap: 6, marginBottom: 16 }}>
            كلمة المرور
            <input
              className="field"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>
          <button
            className="btn btn-primary"
            type="submit"
            disabled={busy}
            style={{ width: '100%' }}
          >
            {busy ? 'جاري الدخول…' : 'دخول'}
          </button>
        </form>
        {message ? (
          <p style={{ marginTop: 14, color: 'var(--status-error)', fontSize: '0.9rem' }}>
            {message}
          </p>
        ) : null}
        <p style={{ marginTop: 14, color: 'var(--muted)', fontSize: '0.85rem' }}>
          تجربة:{' '}
          <span className="en" style={{ fontFamily: 'var(--font-en)' }}>
            seller@tarweej.local / Seller123!
          </span>
        </p>
        <p style={{ marginTop: 8 }}>
          <Link href="/">العودة للرئيسية</Link>
        </p>
      </section>
    </div>
  );
}
