import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ListingGrid } from '../../../components/ListingGrid';
import { listCategories, searchListings, type CategoryNode } from '../../../lib/api';
import { findSection } from '../../../lib/sections';

function matchCategory(nodes: CategoryNode[], hints: string[]): CategoryNode | undefined {
  const walk = (node: CategoryNode): CategoryNode | undefined => {
    const slug = node.slug.toLowerCase();
    const name = node.name.toLowerCase();
    for (const hint of hints) {
      if (slug.includes(hint) || name.includes(hint.replaceAll('-', ' '))) {
        return node;
      }
    }
    for (const child of node.children ?? []) {
      const hit = walk(child);
      if (hit) {
        return hit;
      }
    }
    return undefined;
  };

  for (const node of nodes) {
    const hit = walk(node);
    if (hit) {
      return hit;
    }
  }
  return undefined;
}

export default async function SectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const section = findSection(slug);
  if (!section) {
    notFound();
  }

  if (section.comingSoon) {
    return (
      <div className="container">
        <section className="hero">
          <h1>{section.titleAr}</h1>
          <p>{section.hintAr}</p>
        </section>
        <div className="state-box">هذا القسم قادم قريباً.</div>
      </div>
    );
  }

  let items: Awaited<ReturnType<typeof searchListings>>['items'] = [];
  let error: string | null = null;
  try {
    const tree = await listCategories('ar').catch(() => [] as CategoryNode[]);
    const matched = matchCategory(tree, section.hints);
    const page = await searchListings({
      categoryId: matched?.id,
      page: 1,
      pageSize: 24,
      sort: 'newest',
    });
    items = page.items;
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load section';
  }

  return (
    <div className="container">
      <section className="hero">
        <h1>{section.titleAr}</h1>
        <p>{section.hintAr}</p>
      </section>
      <div className="section-title">
        <h2>إعلانات القسم</h2>
        <Link href="/">الرئيسية</Link>
      </div>
      {error ? <div className="state-box">{error}</div> : <ListingGrid items={items} />}
    </div>
  );
}
