import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="container" style={{ maxWidth: 480, margin: '2rem auto 3rem' }}>
      <section className="panel">
        <h1 style={{ marginTop: 0 }}>دخول ترويج</h1>
        <p style={{ color: 'var(--muted)' }}>
          سجّل الدخول عبر واجهة الهوية `/identity` (بريد أو OTP). هذا الهيكل جاهز للربط بنفس رموز
          الـ API المستخدمة في الجوال.
        </p>
        <label style={{ display: 'grid', gap: 6, marginBottom: 12 }}>
          البريد
          <input className="field" type="email" placeholder="you@example.com" />
        </label>
        <label style={{ display: 'grid', gap: 6, marginBottom: 16 }}>
          كلمة المرور
          <input className="field" type="password" placeholder="••••••••" />
        </label>
        <button className="btn btn-primary" type="button" style={{ width: '100%' }}>
          دخول
        </button>
        <p style={{ marginTop: 14 }}>
          <Link href="/dashboard">متابعة إلى لوحة المستخدم</Link>
        </p>
      </section>
    </div>
  );
}
