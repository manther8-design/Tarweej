import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:tarweej_mobile/features/favorites/application/favorites_controller.dart';
import 'package:tarweej_mobile/l10n/app_localizations.dart';
import 'package:tarweej_mobile/shared/widgets/async_state_views.dart';
import 'package:tarweej_mobile/shared/widgets/listing_card.dart';
import 'package:tarweej_mobile/shared/widgets/marketplace_background.dart';

class FavoritesPage extends ConsumerStatefulWidget {
  const FavoritesPage({super.key});

  @override
  ConsumerState<FavoritesPage> createState() => _FavoritesPageState();
}

class _FavoritesPageState extends ConsumerState<FavoritesPage> {
  @override
  void initState() {
    super.initState();
    Future<void>.microtask(() => ref.read(favoritesControllerProvider.notifier).load());
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final state = ref.watch(favoritesControllerProvider);

    return MarketplaceBackground(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(title: Text(l10n.favoritesTitle)),
        body: state.loading && state.items.isEmpty
            ? const MarketplaceLoadingView()
            : state.error != null && state.items.isEmpty
                ? MarketplaceErrorView(
                    message: state.error!,
                    retryLabel: l10n.favoritesRetry,
                    onRetry: () => ref.read(favoritesControllerProvider.notifier).load(),
                  )
                : state.items.isEmpty
                    ? MarketplaceEmptyView(
                        title: l10n.favoritesEmpty,
                        subtitle: l10n.favoritesEmptyHint,
                        icon: Icons.favorite_border_rounded,
                        actionLabel: l10n.openSearchAction,
                        onAction: () => context.goNamed('search'),
                      )
                    : ListView.separated(
                        padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
                        itemCount: state.items.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 12),
                        itemBuilder: (context, index) {
                          final item = state.items[index];
                          final title = item.listing?.title ?? l10n.favoritesUnavailable;
                          final availabilityLabel = switch (item.availability) {
                            'available' => l10n.favoritesAvailable,
                            'expired' => l10n.favoritesExpired,
                            'deleted' => l10n.favoritesDeleted,
                            _ => l10n.favoritesUnavailable,
                          };
                          final canOpen = item.availability == 'available';

                          return ListingCard(
                            dense: true,
                            data: ListingCardData(
                              id: item.listingId,
                              title: title,
                              priceAmount: item.listing?.priceAmount,
                              currencyCode: item.listing?.currencyCode,
                              coverImageUrl: item.listing?.thumbnailUrl,
                              subtitle: availabilityLabel,
                            ),
                            trailing: IconButton(
                              tooltip: l10n.favoritesRemoveAction,
                              onPressed: () => ref
                                  .read(favoritesControllerProvider.notifier)
                                  .remove(item.listingId),
                              icon: const Icon(Icons.favorite_rounded),
                            ),
                            onTap: canOpen
                                ? () => context.goNamed(
                                      'listing-detail',
                                      pathParameters: <String, String>{'id': item.listingId},
                                    )
                                : () {},
                          );
                        },
                      ),
      ),
    );
  }
}
