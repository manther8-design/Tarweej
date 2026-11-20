import 'package:flutter/material.dart';

/// Product verticals for the Sections hub (stable slugs; category APIs attach later).
enum SectionVertical {
  general,
  services,
  cars,
  realEstate,
  jobs,
  shops,
  auctions,
  electronics,
  animals,
}

extension SectionVerticalX on SectionVertical {
  String get slug => switch (this) {
        SectionVertical.general => 'general',
        SectionVertical.services => 'services',
        SectionVertical.cars => 'cars',
        SectionVertical.realEstate => 'real-estate',
        SectionVertical.jobs => 'jobs',
        SectionVertical.shops => 'shops',
        SectionVertical.auctions => 'auctions',
        SectionVertical.electronics => 'electronics',
        SectionVertical.animals => 'animals',
      };

  IconData get icon => switch (this) {
        SectionVertical.general => Icons.grid_view_rounded,
        SectionVertical.services => Icons.handyman_outlined,
        SectionVertical.cars => Icons.directions_car_outlined,
        SectionVertical.realEstate => Icons.home_work_outlined,
        SectionVertical.jobs => Icons.work_outline_rounded,
        SectionVertical.shops => Icons.storefront_outlined,
        SectionVertical.auctions => Icons.gavel_rounded,
        SectionVertical.electronics => Icons.devices_other_outlined,
        SectionVertical.animals => Icons.pets_outlined,
      };

  bool get isPlaceholder =>
      this == SectionVertical.electronics || this == SectionVertical.animals;

  /// Optional catalog slug hints used when filtering search by category name match.
  List<String> get categorySlugHints => switch (this) {
        SectionVertical.general => const ['general', 'products', 'misc'],
        SectionVertical.services => const ['services', 'service'],
        SectionVertical.cars => const ['cars', 'vehicles', 'autos'],
        SectionVertical.realEstate => const ['real-estate', 'property', 'housing'],
        SectionVertical.jobs => const ['jobs', 'careers', 'employment'],
        SectionVertical.shops => const ['shops', 'stores', 'retail'],
        SectionVertical.auctions => const ['auctions', 'auction'],
        SectionVertical.electronics => const ['electronics', 'gadgets'],
        SectionVertical.animals => const ['animals', 'pets'],
      };

  static SectionVertical? fromSlug(String slug) {
    for (final value in SectionVertical.values) {
      if (value.slug == slug) {
        return value;
      }
    }
    return null;
  }
}
