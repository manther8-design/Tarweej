import Link from 'next/link';
import { formatPrice, type ListingHit } from '../lib/api';

export function ListingCard({
  listing,
  featured = false,
}: {
  listing: ListingHit;
  featured?: boolean;
}) {
  const isFeatured = featured || Boolean(listing.isFeaturedCached);
  return (
    <Link
      className={`listing-card${isFeatured ? ' featured' : ''}`}
      href={`/listings/${listing.id}`}
    >
      <div className="listing-card-media">
        {listing.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={listing.coverImageUrl} alt={listing.title} />
        ) : null}
        {isFeatured ? <span className="badge-featured">★ مميز</span> : null}
      </div>
      <div className="listing-card-body">
        <div className="title">{listing.title}</div>
        <div className="meta">{listing.status ?? 'active'}</div>
      </div>
      <div className="listing-card-foot">
        <div className="price">{formatPrice(listing.priceAmount, listing.currencyCode)}</div>
        <div className="meta">ترويج</div>
      </div>
    </Link>
  );
}
