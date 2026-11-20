import Link from 'next/link';

const links = [
  { href: '/dashboard', label: 'ملخص', active: true },
  { href: '/dashboard/listings', label: 'إعلاناتي' },
  { href: '/dashboard/favorites', label: 'المفضلة' },
  { href: '/dashboard/messages', label: 'الرسائل' },
  { href: '/dashboard/payments', label: 'المدفوعات' },
  { href: '/dashboard/settings', label: 'الإعدادات' },
];

export default function DashboardPage() {
  return (
    <div className="container dashboard-shell">
      <aside className="dashboard-nav">
        <div className="brand" style={{ marginBottom: '0.5rem' }}>
          حسابي
        </div>
        {links.map((link) => (
          <Link key={link.href} href={link.href} className={link.active ? 'active' : undefined}>
            {link.label}
          </Link>
        ))}
      </aside>
      <section className="panel">
        <h1 style={{ marginTop: 0 }}>لوحة المستخدم</h1>
        <p style={{ color: 'var(--muted)' }}>
          هيكل لوحة التحكم العامة — إدارة الإعلانات، المميزة، الرسائل، المفضلة، والمدفوعات. اربط
          الجلسة عبر `/identity` عند تسجيل الدخول.
        </p>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
          <div className="panel">
            <strong>إعلاناتي</strong>
            <p style={{ color: 'var(--muted)' }}>مسودة · قيد المراجعة · نشط</p>
            <Link className="btn btn-ghost" href="/login">
              إدارة
            </Link>
          </div>
          <div className="panel">
            <strong>المميزة</strong>
            <p style={{ color: 'var(--muted)' }}>ترقية ظهور الإعلان بعد الدفع المؤكد من الخادم.</p>
            <Link className="btn btn-ghost" href="/login">
              الترقية
            </Link>
          </div>
          <div className="panel">
            <strong>الرسائل</strong>
            <p style={{ color: 'var(--muted)' }}>محادثات مرتبطة بالإعلانات.</p>
            <Link className="btn btn-ghost" href="/login">
              فتح
            </Link>
          </div>
          <div className="panel">
            <strong>المفضلة</strong>
            <p style={{ color: 'var(--muted)' }}>الإعلانات المحفوظة.</p>
            <Link className="btn btn-ghost" href="/login">
              عرض
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
