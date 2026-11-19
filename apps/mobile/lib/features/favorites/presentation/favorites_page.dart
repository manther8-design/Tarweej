import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:tarweej_mobile/features/favorites/application/favorites_controller.dart';
import 'package:tarweej_mobile/l10n/app_localizations.dart';

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

    return Scaffold(
      appBar: AppBar(title: Text(l10n.favoritesTitle)),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: state.loading && state.items.isEmpty
            ? const Center(child: CircularProgressIndicator())
            : state.error != null && state.items.isEmpty
                ? Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(state.error!),
                      const SizedBox(height: 12),
                      FilledButton(
                        onPressed: () => ref.read(favoritesControllerProvider.notifier).load(),
                        child: Text(l10n.favoritesRetry),
                      ),
                    ],
                  )
                : state.items.isEmpty
                    ? Text(l10n.favoritesEmpty)
                    : ListView.separated(
                        itemCount: state.items.length,
                        separatorBuilder: (_, __) => const Divider(height: 24),
                        itemBuilder: (context, index) {
                          final item = state.items[index];
                          final title = item.listing?.title ?? l10n.favoritesUnavailable;
                          final availabilityLabel = switch (item.availability) {
                            'available' => l10n.favoritesAvailable,
                            'expired' => l10n.favoritesExpired,
                            'deleted' => l10n.favoritesDeleted,
                            _ => l10n.favoritesUnavailable,
                          };
                          final price = item.listing?.priceAmount == null
                              ? l10n.searchPriceUnavailable
                              : '${item.listing!.priceAmount!.toStringAsFixed(0)} ${item.listing!.currencyCode ?? ''}';
                          final canOpen = item.availability == 'available';

                          return ListTile(
                            contentPadding: EdgeInsets.zero,
                            title: Text(title),
                            subtitle: Text('$availabilityLabel · $price'),
                            trailing: IconButton(
                              tooltip: l10n.favoritesRemoveAction,
                              onPressed: () => ref
                                  .read(favoritesControllerProvider.notifier)
                                  .remove(item.listingId),
                              icon: const Icon(Icons.favorite),
                            ),
                            onTap: canOpen
                                ? () => context.goNamed(
                                      'listing-detail',
                                      pathParameters: <String, String>{'id': item.listingId},
                                    )
                                : null,
                          );
                        },
                      ),
      ),
    );
  }
}
