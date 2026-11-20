import Link from 'next/link';
import { formatPrice, type ListingHit } from '../lib/api';

export function ListingCard({ listing }: { listing: ListingHit }) {
  return (
    <Link className="listing-card" href={`/listings/${listing.id}`}>
      <div className="listing-card-media">
        {listing.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={listing.coverImageUrl} alt={listing.title} />
        ) : null}
        {listing.isFeaturedCached ? <span className="badge-featured">Featured</span> : null}
      </div>
      <div className="listing-card-body">
        <div className="price">{formatPrice(listing.priceAmount, listing.currencyCode)}</div>
        <div className="title">{listing.title}</div>
        <div className="meta">{listing.status ?? 'active'}</div>
      </div>
    </Link>
  );
}
