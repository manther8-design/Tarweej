import type { ListingHit } from '../lib/api';
import { ListingCard } from './ListingCard';

export function ListingGrid({
  items,
  empty = 'No listings yet.',
  featured = false,
}: {
  items: ListingHit[];
  empty?: string;
  featured?: boolean;
}) {
  if (!items.length) {
    return <div className="state-box">{empty}</div>;
  }

  return (
    <div className="grid">
      {items.map((listing) => (
        <ListingCard key={listing.id} listing={listing} featured={featured} />
      ))}
    </div>
  );
}
