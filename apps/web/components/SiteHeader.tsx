import Link from 'next/link';
import { TarweejLogo } from './TarweejLogo';

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container site-header-inner">
        <Link href="/" aria-label="ترويج">
          <TarweejLogo />
        </Link>

        <form className="header-search" action="/">
          <select className="city-select" name="city" defaultValue="" aria-label="City">
            <option value="">كل المدن</option>
            <option value="الرياض">الرياض</option>
            <option value="جدة">جدة</option>
            <option value="الدمام">الدمام</option>
            <option value="الخبر">الخبر</option>
          </select>
          <input name="q" placeholder="ابحث عن جوالات، سيارات، عقارات…" aria-label="Search" />
        </form>

        <Link className="icon-btn" href="/dashboard" title="المفضلة" aria-label="Favorites">
          ♥<span className="dot" />
        </Link>
        <Link className="icon-btn" href="/dashboard" title="الرسائل" aria-label="Messages">
          ✉
        </Link>
        <Link className="btn btn-primary" href="/login">
          + أضف إعلان
        </Link>
        <Link className="btn btn-ghost" href="/dashboard">
          حسابي
        </Link>
      </div>

      <div className="category-bar">
        <div className="container category-bar-inner">
          <Link className="chip active" href="/">
            الكل
          </Link>
          <Link className="chip" href="/sections/general">
            <span className="accent">◆</span> منتجات عامة
          </Link>
          <Link className="chip" href="/sections/services">
            <span className="accent">◆</span> خدمات
          </Link>
          <Link className="chip" href="/sections/cars">
            <span className="accent">◆</span> سيارات
          </Link>
          <Link className="chip" href="/sections/real-estate">
            <span className="accent">◆</span> عقارات
          </Link>
          <Link className="chip" href="/sections/jobs">
            <span className="accent">◆</span> وظائف
          </Link>
          <Link className="chip" href="/sections/shops">
            <span className="accent">◆</span> متاجر
          </Link>
          <Link className="chip" href="/sections/auctions">
            <span className="accent">◆</span> مزادات
          </Link>
        </div>
      </div>
    </header>
  );
}
