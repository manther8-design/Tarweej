export type SectionDef = {
  slug: string;
  titleAr: string;
  titleEn: string;
  hintAr: string;
  hintEn: string;
  hints: string[];
  comingSoon?: boolean;
};

export const SECTIONS: SectionDef[] = [
  {
    slug: 'general',
    titleAr: 'منتجات عامة',
    titleEn: 'General products',
    hintAr: 'سلع يومية وإعلانات متنوعة',
    hintEn: 'Everyday goods and miscellaneous ads',
    hints: ['general', 'products', 'misc'],
  },
  {
    slug: 'services',
    titleAr: 'خدمات',
    titleEn: 'Services',
    hintAr: 'خدمات محلية وعروض مهنية',
    hintEn: 'Local professionals and service offers',
    hints: ['services', 'service'],
  },
  {
    slug: 'cars',
    titleAr: 'سيارات',
    titleEn: 'Cars',
    hintAr: 'مركبات وإعلانات السيارات',
    hintEn: 'Vehicles and automotive listings',
    hints: ['cars', 'vehicles', 'autos'],
  },
  {
    slug: 'real-estate',
    titleAr: 'عقارات',
    titleEn: 'Real estate',
    hintAr: 'منازل وأراضٍ وإيجارات',
    hintEn: 'Homes, land, and rentals',
    hints: ['real-estate', 'property', 'housing'],
  },
  {
    slug: 'jobs',
    titleAr: 'وظائف',
    titleEn: 'Jobs',
    hintAr: 'فرص توظيف ووظائف',
    hintEn: 'Hiring and career openings',
    hints: ['jobs', 'careers', 'employment'],
  },
  {
    slug: 'shops',
    titleAr: 'متاجر',
    titleEn: 'Shops',
    hintAr: 'متاجر وعلامات تجارية',
    hintEn: 'Storefronts and retail brands',
    hints: ['shops', 'stores', 'retail'],
  },
  {
    slug: 'auctions',
    titleAr: 'مزادات',
    titleEn: 'Auctions',
    hintAr: 'مزادات وعروض بمزايدة',
    hintEn: 'Timed bids and auction lots',
    hints: ['auctions', 'auction'],
  },
  {
    slug: 'electronics',
    titleAr: 'إلكترونيات',
    titleEn: 'Electronics',
    hintAr: 'قريباً',
    hintEn: 'Coming soon',
    hints: ['electronics'],
    comingSoon: true,
  },
  {
    slug: 'animals',
    titleAr: 'حيوانات',
    titleEn: 'Animals',
    hintAr: 'قريباً',
    hintEn: 'Coming soon',
    hints: ['animals', 'pets'],
    comingSoon: true,
  },
];

export function findSection(slug: string) {
  return SECTIONS.find((section) => section.slug === slug);
}
