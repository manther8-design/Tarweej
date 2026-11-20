import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <div className="brand">ترويج</div>
          <p>منصة إعلانات مبوبة متعددة الأقسام — جوال وويب بهوية واحدةحدة.</p>
        </div>
        <div>
          <strong>Explore</strong>
          <p>
            <Link href="/sections/cars">سيارات</Link>
            <br />
            <Link href="/sections/real-estate">عقارات</Link>
            <br />
            <Link href="/sections/jobs">وظائف</Link>
          </p>
        </div>
        <div>
          <strong>Legal</strong>
          <p>
            Terms · Privacy · Contact
            <br />
            support@tarweej.local
          </p>
        </div>
      </div>
    </footer>
  );
}
