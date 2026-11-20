import Link from 'next/link';
import { ListingGrid } from '../components/ListingGrid';
import { listCategories, searchListings, type CategoryNode } from '../lib/api';
import { SECTIONS } from '../lib/sections';

function flattenCategories(nodes: CategoryNode[]): CategoryNode[] {
  const out: CategoryNode[] = [];
  const walk = (node: CategoryNode) => {
    out.push(node);
    for (const child of node.children ?? []) {
      walk(child);
    }
  };
  for (const node of nodes) {
    walk(node);
  }
  return out;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  let feedError: string | null = null;
  let categories: CategoryNode[] = [];
  let items: Awaited<ReturnType<typeof searchListings>>['items'] = [];
  let featured: Awaited<ReturnType<typeof searchListings>>['items'] = [];

  try {
    const [tree, latest, featuredPage] = await Promise.all([
      listCategories('ar').catch(() => [] as CategoryNode[]),
      searchListings({ q: params.q, page: 1, pageSize: 12, sort: 'newest' }),
      searchListings({ featured: 1, page: 1, pageSize: 6, sort: 'featured' }),
    ]);
    categories = flattenCategories(tree).slice(0, 8);
    items = latest.items;
    featured = featuredPage.items.length
      ? featuredPage.items
      : latest.items.filter((i) => i.isFeaturedCached).slice(0, 6);
  } catch (error) {
    feedError = error instanceof Error ? error.message : 'Failed to load marketplace feed';
  }

  return (
    <div className="container page-pad">
      <div className="section-title">
        <h2>
          <span className="bar" />
          إعلانات مميزة
          <span className="promo-pill">PROMOTED</span>
        </h2>
        <Link href="/sections/general">عرض الكل</Link>
      </div>
      {feedError ? (
        <div className="state-box">{feedError}</div>
      ) : (
        <ListingGrid items={featured} empty="لا توجد إعلانات مميزة بعد." featured />
      )}

      <div className="section-title">
        <h2>
          <span className="bar" />
          {params.q ? `نتائج: ${params.q}` : 'أحدث الإعلانات'}
        </h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {SECTIONS.filter((s) => !s.comingSoon)
            .slice(0, 4)
            .map((section) => (
              <Link key={section.slug} className="chip" href={`/sections/${section.slug}`}>
                {section.titleAr}
              </Link>
            ))}
          {categories.slice(0, 2).map((category) => (
            <Link
              key={category.id}
              className="chip"
              href={`/?q=${encodeURIComponent(category.name)}`}
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>
      {feedError ? (
        <div className="state-box">{feedError}</div>
      ) : (
        <ListingGrid items={items} empty="لا توجد إعلانات بعد." />
      )}
    </div>
  );
}
