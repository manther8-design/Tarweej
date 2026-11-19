/** Supported dynamic attribute data types (domain VO). */
export const ATTRIBUTE_DATA_TYPES = [
  'text',
  'number',
  'int',
  'decimal',
  'single_select',
  'multi_select',
  'bool',
  'date',
  'numeric_range',
  'unit',
] as const;

export type AttributeDataType = (typeof ATTRIBUTE_DATA_TYPES)[number];

export const LISTING_TYPES = [
  'marketplace',
  'services',
  'jobs',
  'motors',
  'real_estate',
  'auctions',
  'stores',
] as const;

export type ListingType = (typeof LISTING_TYPES)[number];
