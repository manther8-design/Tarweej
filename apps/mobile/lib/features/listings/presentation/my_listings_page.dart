import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:tarweej_mobile/features/listings/application/listings_controller.dart';
import 'package:tarweej_mobile/l10n/app_localizations.dart';
import 'package:tarweej_mobile/shared/widgets/async_state_views.dart';
import 'package:tarweej_mobile/shared/widgets/listing_card.dart';
import 'package:tarweej_mobile/shared/widgets/marketplace_background.dart';

class MyListingsPage extends ConsumerStatefulWidget {
  const MyListingsPage({super.key});

  @override
  ConsumerState<MyListingsPage> createState() => _MyListingsPageState();
}

class _MyListingsPageState extends ConsumerState<MyListingsPage> {
  @override
  void initState() {
    super.initState();
    Future<void>.microtask(() => ref.read(listingsControllerProvider.notifier).loadMine());
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final state = ref.watch(listingsControllerProvider);

    return MarketplaceBackground(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(
          title: Text(l10n.myListingsTitle),
          actions: [
            IconButton(
              tooltip: l10n.createListingAction,
              onPressed: () => context.goNamed('listing-create'),
              icon: const Icon(Icons.add_rounded),
            ),
          ],
        ),
        floatingActionButton: FloatingActionButton.extended(
          onPressed: () => context.goNamed('listing-create'),
          icon: const Icon(Icons.add_rounded),
          label: Text(l10n.createListingAction),
        ),
        body: state.loading && state.mine.isEmpty
            ? const MarketplaceLoadingView()
            : state.error != null && state.mine.isEmpty
                ? MarketplaceErrorView(
                    message: state.error!,
                    retryLabel: l10n.myListingsRetry,
                    onRetry: () => ref.read(listingsControllerProvider.notifier).loadMine(),
                  )
                : state.mine.isEmpty
                    ? MarketplaceEmptyView(
                        title: l10n.myListingsEmpty,
                        subtitle: l10n.myListingsSubtitle,
                        icon: Icons.inventory_2_outlined,
                        actionLabel: l10n.createListingAction,
                        onAction: () => context.goNamed('listing-create'),
                      )
                    : RefreshIndicator(
                        onRefresh: () =>
                            ref.read(listingsControllerProvider.notifier).loadMine(),
                        child: ListView.separated(
                          padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
                          itemCount: state.mine.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 12),
                          itemBuilder: (context, index) {
                            final item = state.mine[index];
                            return ListingCard(
                              dense: true,
                              data: ListingCardData(
                                id: item.id,
                                title: item.title,
                                priceAmount: item.priceAmount,
                                currencyCode: item.currencyCode,
                                coverImageUrl: item.coverImageUrl,
                                isFeatured: item.isFeaturedCached,
                                subtitle:
                                    '${item.status} · ${l10n.listingViewsLabel}: ${item.viewCount}',
                              ),
                              onTap: () => context.goNamed(
                                'listing-detail',
                                pathParameters: <String, String>{'id': item.id},
                                queryParameters: <String, String>{'mine': '1'},
                              ),
                            );
                          },
                        ),
                      ),
      ),
    );
  }
}
