import Link from 'next/link';

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container site-header-inner">
        <Link href="/" className="brand">
          ترويج
          <span>Tarweej marketplace</span>
        </Link>
        <form className="header-search" action="/">
          <input name="q" placeholder="ابحث عن جوالات، سيارات، عقارات…" aria-label="Search" />
          <button className="btn btn-primary" type="submit">
            بحث
          </button>
        </form>
        <Link className="btn btn-ghost" href="/sections/general">
          الأقسام
        </Link>
        <Link className="btn btn-ghost" href="/dashboard">
          حسابي
        </Link>
        <Link className="btn btn-primary" href="/login">
          دخول
        </Link>
      </div>
    </header>
  );
}
