import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:tarweej_mobile/core/theme/tarweej_colors.dart';
import 'package:tarweej_mobile/features/catalog/application/catalog_controller.dart';
import 'package:tarweej_mobile/features/catalog/domain/catalog_models.dart';
import 'package:tarweej_mobile/features/reference/application/reference_controller.dart';
import 'package:tarweej_mobile/features/search/application/search_controller.dart';
import 'package:tarweej_mobile/features/search/domain/search_models.dart';
import 'package:tarweej_mobile/features/sections/domain/section_vertical.dart';
import 'package:tarweej_mobile/l10n/app_localizations.dart';
import 'package:tarweej_mobile/shared/widgets/async_state_views.dart';
import 'package:tarweej_mobile/shared/widgets/listing_card.dart';
import 'package:tarweej_mobile/shared/widgets/marketplace_background.dart';

class SectionDetailPage extends ConsumerStatefulWidget {
  const SectionDetailPage({required this.slug, super.key});

  final String slug;

  @override
  ConsumerState<SectionDetailPage> createState() => _SectionDetailPageState();
}

class _SectionDetailPageState extends ConsumerState<SectionDetailPage> {
  String? _matchedCategoryId;
  bool _loading = true;
  String? _error;
  List<SearchListingHit> _items = const [];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _bootstrap());
  }

  Future<void> _bootstrap() async {
    final vertical = SectionVerticalX.fromSlug(widget.slug);
    if (vertical == null) {
      setState(() {
        _loading = false;
        _error = 'Unknown section';
      });
      return;
    }
    if (vertical.isPlaceholder) {
      setState(() => _loading = false);
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final catalog = ref.read(catalogControllerProvider);
      if (catalog.roots.isEmpty) {
        await ref.read(catalogControllerProvider.notifier).loadTree();
      }
      final roots = ref.read(catalogControllerProvider).roots;
      final match = _findCategory(roots, vertical.categorySlugHints);
      _matchedCategoryId = match?.id;

      final countryId = ref.read(referenceControllerProvider).selectedCountryId;
      final result = await ref.read(searchApiProvider).searchListings(
            SearchQuery(
              categoryId: match?.id,
              countryId: countryId,
              page: 1,
              pageSize: 40,
              sort: 'newest',
            ),
          );
      if (!mounted) {
        return;
      }
      setState(() {
        _items = result.items;
        _loading = false;
      });
    } catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _loading = false;
        _error = error.toString();
      });
    }
  }

  CatalogCategory? _findCategory(List<CatalogCategory> roots, List<String> hints) {
    CatalogCategory? walk(CatalogCategory node) {
      final slug = node.slug.toLowerCase();
      final name = node.name.toLowerCase();
      for (final hint in hints) {
        if (slug.contains(hint) || name.contains(hint.replaceAll('-', ' '))) {
          return node;
        }
      }
      for (final child in node.children) {
        final hit = walk(child);
        if (hit != null) {
          return hit;
        }
      }
      return null;
    }

    for (final root in roots) {
      final hit = walk(root);
      if (hit != null) {
        return hit;
      }
    }
    return null;
  }

  String _title(AppLocalizations l10n, SectionVertical? vertical) {
    if (vertical == null) {
      return l10n.sectionsTitle;
    }
    return switch (vertical) {
      SectionVertical.general => l10n.sectionGeneral,
      SectionVertical.services => l10n.sectionServices,
      SectionVertical.cars => l10n.sectionCars,
      SectionVertical.realEstate => l10n.sectionRealEstate,
      SectionVertical.jobs => l10n.sectionJobs,
      SectionVertical.shops => l10n.sectionShops,
      SectionVertical.auctions => l10n.sectionAuctions,
      SectionVertical.electronics => l10n.sectionElectronics,
      SectionVertical.animals => l10n.sectionAnimals,
    };
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final vertical = SectionVerticalX.fromSlug(widget.slug);
    final reference = ref.watch(referenceControllerProvider);

    return MarketplaceBackground(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(
          title: Text(_title(l10n, vertical)),
          actions: [
            IconButton(
              tooltip: l10n.openSearchAction,
              onPressed: () => context.goNamed(
                'search',
                queryParameters: _matchedCategoryId == null
                    ? const <String, String>{}
                    : <String, String>{'categoryId': _matchedCategoryId!},
              ),
              icon: const Icon(Icons.search_rounded),
            ),
          ],
        ),
        body: _loading
            ? const MarketplaceLoadingView()
            : _error != null
                ? MarketplaceErrorView(
                    message: _error!,
                    retryLabel: l10n.homeFeedRetry,
                    onRetry: _bootstrap,
                  )
                : vertical?.isPlaceholder == true
                    ? MarketplaceEmptyView(
                        title: l10n.sectionComingSoonTitle,
                        subtitle: l10n.sectionComingSoonHint,
                        icon: vertical!.icon,
                        actionLabel: l10n.browseCategoriesAction,
                        onAction: () => context.goNamed('categories'),
                      )
                    : _items.isEmpty
                        ? MarketplaceEmptyView(
                            title: l10n.homeFeedEmpty,
                            subtitle: l10n.sectionEmptyHint,
                            icon: vertical?.icon ?? Icons.grid_view_rounded,
                            actionLabel: l10n.openSearchAction,
                            onAction: () => context.goNamed('search'),
                          )
                        : RefreshIndicator(
                            color: TarweejColors.tealDeep,
                            onRefresh: _bootstrap,
                            child: GridView.builder(
                              padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                              gridDelegate:
                                  const SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: 2,
                                mainAxisSpacing: 12,
                                crossAxisSpacing: 12,
                                childAspectRatio: 0.66,
                              ),
                              itemCount: _items.length,
                              itemBuilder: (context, index) {
                                final hit = _items[index];
                                return ListingCard(
                                  data: ListingCardData(
                                    id: hit.id,
                                    title: hit.title,
                                    priceAmount: hit.priceAmount,
                                    currencyCode: hit.currencyCode,
                                    coverImageUrl: hit.coverImageUrl,
                                    isFeatured: hit.isFeaturedCached,
                                    locationLabel:
                                        reference.selectedCountryName ??
                                            l10n.listingLocationUnavailable,
                                  ),
                                  onTap: () => context.goNamed(
                                    'listing-detail',
                                    pathParameters: <String, String>{
                                      'id': hit.id,
                                    },
                                  ),
                                );
                              },
                            ),
                          ),
      ),
    );
  }
}
