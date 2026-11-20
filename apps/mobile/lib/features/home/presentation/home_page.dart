import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:tarweej_mobile/core/theme/tarweej_colors.dart';
import 'package:tarweej_mobile/features/auth/application/auth_controller.dart';
import 'package:tarweej_mobile/features/catalog/application/catalog_controller.dart';
import 'package:tarweej_mobile/features/home/application/home_feed_controller.dart';
import 'package:tarweej_mobile/features/reference/application/reference_controller.dart';
import 'package:tarweej_mobile/features/search/domain/search_models.dart';
import 'package:tarweej_mobile/l10n/app_localizations.dart';
import 'package:tarweej_mobile/shared/widgets/async_state_views.dart';
import 'package:tarweej_mobile/shared/widgets/listing_card.dart';
import 'package:tarweej_mobile/shared/widgets/marketplace_background.dart';

/// AdForest-class marketplace home: hero brand + search, category strip, photo grid.
class HomePage extends ConsumerStatefulWidget {
  const HomePage({super.key});

  @override
  ConsumerState<HomePage> createState() => _HomePageState();
}

class _HomePageState extends ConsumerState<HomePage>
    with SingleTickerProviderStateMixin {
  late final AnimationController _heroMotion;
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _heroMotion = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 850),
    )..forward();
    _scrollController.addListener(_onScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(homeFeedControllerProvider.notifier).bootstrap();
    });
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    _heroMotion.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (!_scrollController.hasClients) {
      return;
    }
    final max = _scrollController.position.maxScrollExtent;
    if (_scrollController.position.pixels > max - 420) {
      ref.read(homeFeedControllerProvider.notifier).loadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final auth = ref.watch(authControllerProvider);
    final reference = ref.watch(referenceControllerProvider);
    final catalog = ref.watch(catalogControllerProvider);
    final feed = ref.watch(homeFeedControllerProvider);
    final topCategories = catalog.roots.take(8).toList(growable: false);
    final countryLabel = reference.selectedCountryName ??
        reference.selectedCountryIso2 ??
        l10n.countrySelectTitle;

    final featured = feed.items
        .where((hit) => hit.isFeaturedCached)
        .take(6)
        .toList(growable: false);
    final latest = feed.items;

    return MarketplaceBackground(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        body: SafeArea(
          child: RefreshIndicator(
            color: TarweejColors.tealDeep,
            onRefresh: () => ref.read(homeFeedControllerProvider.notifier).refresh(),
            child: CustomScrollView(
              controller: _scrollController,
              physics: const AlwaysScrollableScrollPhysics(),
              slivers: [
                SliverToBoxAdapter(
                  child: FadeTransition(
                    opacity: CurvedAnimation(
                      parent: _heroMotion,
                      curve: Curves.easeOutCubic,
                    ),
                    child: SlideTransition(
                      position: Tween<Offset>(
                        begin: const Offset(0, 0.05),
                        end: Offset.zero,
                      ).animate(
                        CurvedAnimation(
                          parent: _heroMotion,
                          curve: Curves.easeOutCubic,
                        ),
                      ),
                      child: _HeroBlock(
                        brand: l10n.appTitle,
                        tagline: l10n.homeTagline,
                        searchHint: l10n.homeSearchHint,
                        countryLabel: countryLabel,
                        changeCountryLabel: l10n.changeCountryAction,
                        onSearch: () => context.goNamed('search'),
                        onCountry: () => context.goNamed('country'),
                        onProfile: () => context.goNamed('account'),
                        onNotifications: () => context.goNamed(
                          auth.isAuthenticated ? 'notifications' : 'login',
                        ),
                        notificationsTooltip: l10n.notificationsTitle,
                        profileTooltip: l10n.profileTitle,
                      ),
                    ),
                  ),
                ),
                SliverToBoxAdapter(
                  child: _CategoryStrip(
                    allLabel: l10n.homeAllListings,
                    browseLabel: l10n.browseCategoriesAction,
                    selectedId: feed.selectedCategoryId,
                    categories: topCategories
                        .map((c) => (c.id, c.name))
                        .toList(growable: false),
                    onAll: () =>
                        ref.read(homeFeedControllerProvider.notifier).selectCategory(null),
                    onCategory: (id) => ref
                        .read(homeFeedControllerProvider.notifier)
                        .selectCategory(
                          feed.selectedCategoryId == id ? null : id,
                        ),
                    onBrowse: () => context.goNamed('categories'),
                  ),
                ),
                if (featured.isNotEmpty && feed.selectedCategoryId == null)
                  ..._featuredSection(context, l10n, feed, featured, reference.selectedCountryName),
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 18, 20, 8),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            l10n.homeFeedHeading,
                            style: Theme.of(context).textTheme.titleLarge,
                          ),
                        ),
                        Text(
                          l10n.searchResultsCount(feed.total),
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                ),
                if (feed.loading && latest.isEmpty)
                  const SliverFillRemaining(
                    hasScrollBody: false,
                    child: MarketplaceLoadingView(),
                  )
                else if (feed.error != null && latest.isEmpty)
                  SliverFillRemaining(
                    hasScrollBody: false,
                    child: MarketplaceErrorView(
                      message: feed.error!,
                      retryLabel: l10n.homeFeedRetry,
                      onRetry: () =>
                          ref.read(homeFeedControllerProvider.notifier).load(reset: true),
                    ),
                  )
                else if (latest.isEmpty)
                  SliverFillRemaining(
                    hasScrollBody: false,
                    child: MarketplaceEmptyView(
                      title: l10n.homeFeedEmpty,
                      subtitle: l10n.homeFeedEmptyHint,
                      icon: Icons.storefront_outlined,
                      actionLabel: l10n.openSearchAction,
                      onAction: () => context.goNamed('search'),
                    ),
                  )
                else
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
                    sliver: SliverGrid(
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        mainAxisSpacing: 12,
                        crossAxisSpacing: 12,
                        childAspectRatio: 0.66,
                      ),
                      delegate: SliverChildBuilderDelegate(
                        (context, index) {
                          final hit = latest[index];
                          return ListingCard(
                            data: _cardData(
                              hit,
                              feed.cityNameFor(hit.cityId) ??
                                  reference.selectedCountryName,
                            ),
                            onTap: () => context.goNamed(
                              'listing-detail',
                              pathParameters: <String, String>{'id': hit.id},
                            ),
                          );
                        },
                        childCount: latest.length,
                      ),
                    ),
                  ),
                if (feed.loading && latest.isNotEmpty)
                  const SliverToBoxAdapter(
                    child: Padding(
                      padding: EdgeInsets.only(bottom: 16),
                      child: Center(child: CircularProgressIndicator()),
                    ),
                  ),
                const SliverToBoxAdapter(child: SizedBox(height: 24)),
              ],
            ),
          ),
        ),
        floatingActionButton: FloatingActionButton.extended(
          onPressed: () => context.goNamed(
            auth.isAuthenticated ? 'listing-create' : 'login',
          ),
          backgroundColor: TarweejColors.orange500,
          foregroundColor: Colors.white,
          icon: const Icon(Icons.add_rounded),
          label: Text(l10n.homeSellAction),
        ),
      ),
    );
  }

  List<Widget> _featuredSection(
    BuildContext context,
    AppLocalizations l10n,
    HomeFeedState feed,
    List<SearchListingHit> featured,
    String? countryName,
  ) {
    return [
      SliverToBoxAdapter(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
          child: Text(
            l10n.homeFeaturedHeading,
            style: Theme.of(context).textTheme.titleLarge,
          ),
        ),
      ),
      SliverToBoxAdapter(
        child: SizedBox(
          height: 268,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: featured.length,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (context, index) {
              final hit = featured[index];
              return SizedBox(
                width: 196,
                child: ListingCard(
                  data: _cardData(
                    hit,
                    feed.cityNameFor(hit.cityId) ?? countryName,
                  ),
                  onTap: () => context.goNamed(
                    'listing-detail',
                    pathParameters: <String, String>{'id': hit.id},
                  ),
                ),
              );
            },
          ),
        ),
      ),
    ];
  }

  ListingCardData _cardData(SearchListingHit hit, String? location) {
    return ListingCardData(
      id: hit.id,
      title: hit.title,
      priceAmount: hit.priceAmount,
      currencyCode: hit.currencyCode,
      coverImageUrl: hit.coverImageUrl,
      isFeatured: hit.isFeaturedCached,
      locationLabel: location,
    );
  }
}

class _HeroBlock extends StatelessWidget {
  const _HeroBlock({
    required this.brand,
    required this.tagline,
    required this.searchHint,
    required this.countryLabel,
    required this.changeCountryLabel,
    required this.onSearch,
    required this.onCountry,
    required this.onProfile,
    required this.onNotifications,
    required this.notificationsTooltip,
    required this.profileTooltip,
  });

  final String brand;
  final String tagline;
  final String searchHint;
  final String countryLabel;
  final String changeCountryLabel;
  final VoidCallback onSearch;
  final VoidCallback onCountry;
  final VoidCallback onProfile;
  final VoidCallback onNotifications;
  final String notificationsTooltip;
  final String profileTooltip;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
      child: DecoratedBox(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(28),
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: <Color>[
              TarweejColors.blue900,
              TarweejColors.blue800,
              TarweejColors.blue600,
            ],
          ),
          boxShadow: [
            BoxShadow(
              color: TarweejColors.blue800.withValues(alpha: 0.22),
              blurRadius: 24,
              offset: const Offset(0, 12),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(28),
          child: Stack(
            children: [
              Positioned(
                right: -30,
                top: -40,
                child: IgnorePointer(
                  child: Container(
                    width: 160,
                    height: 160,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.white.withValues(alpha: 0.06),
                    ),
                  ),
                ),
              ),
              Positioned(
                left: -20,
                bottom: -50,
                child: IgnorePointer(
                  child: Container(
                    width: 180,
                    height: 180,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: TarweejColors.orange500.withValues(alpha: 0.18),
                    ),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 14, 12, 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                brand,
                                style: Theme.of(context).textTheme.displaySmall?.copyWith(
                                      color: Colors.white,
                                      height: 1.05,
                                      fontWeight: FontWeight.w900,
                                    ),
                              ),
                              Text(
                                'TARWEEJ',
                                style: Theme.of(context).textTheme.labelMedium?.copyWith(
                                      color: TarweejColors.orange500,
                                      fontWeight: FontWeight.w800,
                                      letterSpacing: 2,
                                    ),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          tooltip: notificationsTooltip,
                          onPressed: onNotifications,
                          icon: const Icon(Icons.notifications_none_rounded, color: Colors.white),
                        ),
                        IconButton(
                          tooltip: profileTooltip,
                          onPressed: onProfile,
                          icon: const Icon(Icons.person_outline_rounded, color: Colors.white),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      tagline,
                      style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                            color: Colors.white.withValues(alpha: 0.82),
                            height: 1.35,
                          ),
                    ),
                    const SizedBox(height: 18),
                    Material(
                      color: Colors.transparent,
                      child: InkWell(
                        onTap: onSearch,
                        borderRadius: BorderRadius.circular(16),
                        child: Ink(
                          height: 54,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Row(
                            children: [
                              const SizedBox(width: 14),
                              const Icon(Icons.search_rounded, color: TarweejColors.blue800),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  searchHint,
                                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                        color: TarweejColors.muted,
                                      ),
                                ),
                              ),
                              Container(
                                margin: const EdgeInsets.all(6),
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                                decoration: BoxDecoration(
                                  color: TarweejColors.tealDeep,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: const Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 18),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Icon(Icons.place_outlined, size: 16, color: Colors.white.withValues(alpha: 0.85)),
                        const SizedBox(width: 6),
                        Flexible(
                          child: Text(
                            countryLabel,
                            style: Theme.of(context).textTheme.labelLarge?.copyWith(
                                  color: Colors.white.withValues(alpha: 0.9),
                                ),
                          ),
                        ),
                        TextButton(
                          onPressed: onCountry,
                          style: TextButton.styleFrom(foregroundColor: Colors.white),
                          child: Text(changeCountryLabel),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CategoryStrip extends StatelessWidget {
  const _CategoryStrip({
    required this.allLabel,
    required this.browseLabel,
    required this.selectedId,
    required this.categories,
    required this.onAll,
    required this.onCategory,
    required this.onBrowse,
  });

  final String allLabel;
  final String browseLabel;
  final String? selectedId;
  final List<(String, String)> categories;
  final VoidCallback onAll;
  final ValueChanged<String> onCategory;
  final VoidCallback onBrowse;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 56,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsetsDirectional.only(start: 16, end: 12, top: 12),
        children: [
          Padding(
            padding: const EdgeInsetsDirectional.only(end: 8),
            child: FilterChip(
              label: Text(allLabel),
              selected: selectedId == null,
              onSelected: (_) => onAll(),
            ),
          ),
          ...categories.map(
            (entry) => Padding(
              padding: const EdgeInsetsDirectional.only(end: 8),
              child: FilterChip(
                avatar: Icon(_iconFor(entry.$2), size: 16),
                label: Text(entry.$2),
                selected: selectedId == entry.$1,
                onSelected: (_) => onCategory(entry.$1),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsetsDirectional.only(end: 8),
            child: ActionChip(
              avatar: const Icon(Icons.grid_view_rounded, size: 16),
              label: Text(browseLabel),
              onPressed: onBrowse,
            ),
          ),
        ],
      ),
    );
  }

  IconData _iconFor(String name) {
    final lower = name.toLowerCase();
    if (lower.contains('phone') || lower.contains('جوال') || lower.contains('موبايل')) {
      return Icons.smartphone_rounded;
    }
    if (lower.contains('car') || lower.contains('سيار')) {
      return Icons.directions_car_filled_rounded;
    }
    if (lower.contains('home') || lower.contains('عقار') || lower.contains('real')) {
      return Icons.home_work_outlined;
    }
    if (lower.contains('job') || lower.contains('وظيف')) {
      return Icons.work_outline_rounded;
    }
    if (lower.contains('electr') || lower.contains('إلكتر')) {
      return Icons.devices_other_rounded;
    }
    return Icons.category_outlined;
  }
}

