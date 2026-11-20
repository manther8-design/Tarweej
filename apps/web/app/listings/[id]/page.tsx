import Link from 'next/link';
import { ListingGrid } from '../../../components/ListingGrid';
import { formatPrice, getListing, searchListings } from '../../../lib/api';

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let error: string | null = null;
  let listing: Awaited<ReturnType<typeof getListing>> | null = null;
  let similar: Awaited<ReturnType<typeof searchListings>>['items'] = [];

  try {
    listing = await getListing(id);
    const similarPage = await searchListings({
      categoryId: listing.categoryId,
      page: 1,
      pageSize: 8,
      sort: 'newest',
    });
    similar = similarPage.items.filter((item) => item.id !== id).slice(0, 4);
  } catch (err) {
    error = err instanceof Error ? err.message : 'Listing not found';
  }

  if (error || !listing) {
    return (
      <div className="container">
        <div className="state-box">{error ?? 'Listing not found'}</div>
      </div>
    );
  }

  const cover = listing.media?.[0]?.cdnUrl;
  const seller = listing.owner?.displayName?.trim() || 'بائع ترويج';

  return (
    <div className="container">
      <div className="detail-layout">
        <div className="gallery">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt={listing.title} />
          ) : null}
        </div>
        <div className="panel">
          <p style={{ margin: 0, color: 'var(--orange-600)', fontWeight: 800, fontSize: '1.4rem' }}>
            {formatPrice(listing.priceAmount, listing.currencyCode)}
          </p>
          <h1 style={{ margin: '0.4rem 0 0.8rem' }}>{listing.title}</h1>
          <p style={{ color: 'var(--muted)', marginTop: 0 }}>
            {listing.status} · {listing.viewCount} views
          </p>
          <div className="panel" style={{ marginBottom: '1rem', padding: '0.9rem' }}>
            <strong>المعلن</strong>
            <div>{seller}</div>
          </div>
          <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{listing.description}</p>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            <Link className="btn btn-primary" href="/login">
              مراسلة البائع
            </Link>
            <Link className="btn btn-ghost" href="/dashboard">
              حفظ
            </Link>
            <button className="btn btn-ghost" type="button">
              مشاركة
            </button>
          </div>
          {listing.attributes?.length ? (
            <div style={{ marginTop: '1.25rem' }}>
              <strong>الخصائص</strong>
              <ul>
                {listing.attributes.map((attr) => (
                  <li key={attr.code}>
                    {attr.code}:{' '}
                    {attr.valueText ?? attr.valueNumber ?? String(attr.valueBool ?? '—')}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      <div className="section-title">
        <h2>إعلانات مشابهة</h2>
      </div>
      <ListingGrid items={similar} empty="لا توجد إعلانات مشابهة." />
    </div>
  );
}
