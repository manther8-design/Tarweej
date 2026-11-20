import Link from 'next/link';
import { TarweejLogo } from './TarweejLogo';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <TarweejLogo />
          <p style={{ marginTop: 12, maxWidth: 320 }}>
            منصة إعلانات مبوبة متعددة الأقسام — جوال وويب بهوية موحّدة.
          </p>
        </div>
        <div>
          <strong style={{ color: 'white' }}>روابط</strong>
          <p>
            <Link href="/">الرئيسية</Link>
            <br />
            <Link href="/dashboard">حسابي</Link>
            <br />
            <Link href="/login">دخول</Link>
          </p>
        </div>
        <div>
          <strong style={{ color: 'white' }}>الأقسام</strong>
          <p>
            <Link href="/sections/cars">سيارات</Link>
            <br />
            <Link href="/sections/real-estate">عقارات</Link>
            <br />
            <Link href="/sections/jobs">وظائف</Link>
          </p>
        </div>
        <div>
          <strong style={{ color: 'white' }}>قانوني</strong>
          <p>
            الشروط · الخصوصية
            <br />
            support@tarweej.local
          </p>
        </div>
      </div>
    </footer>
  );
}
