import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:tarweej_mobile/features/listings/application/listings_controller.dart';
import 'package:tarweej_mobile/l10n/app_localizations.dart';

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

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.myListingsTitle),
        actions: [
          IconButton(
            tooltip: l10n.createListingAction,
            onPressed: () => context.goNamed('listing-create'),
            icon: const Icon(Icons.add),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(l10n.myListingsSubtitle),
            const SizedBox(height: 16),
            if (state.loading)
              const LinearProgressIndicator()
            else if (state.error != null)
              Text(state.error!)
            else if (state.mine.isEmpty)
              Text(l10n.myListingsEmpty)
            else
              Expanded(
                child: ListView.separated(
                  itemCount: state.mine.length,
                  separatorBuilder: (_, __) => const Divider(height: 1),
                  itemBuilder: (context, index) {
                    final item = state.mine[index];
                    final price = item.priceAmount == null
                        ? '—'
                        : '${item.priceAmount!.toStringAsFixed(0)} ${item.currencyCode ?? ''}';
                    return ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text(item.title),
                      subtitle: Text('${item.status} · $price · ${item.viewCount} views'),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () => context.goNamed(
                        'listing-detail',
                        pathParameters: <String, String>{'id': item.id},
                        queryParameters: <String, String>{'mine': '1'},
                      ),
                    );
                  },
                ),
              ),
            const SizedBox(height: 12),
            FilledButton(
              onPressed: () => context.goNamed('listing-create'),
              child: Text(l10n.createListingAction),
            ),
          ],
        ),
      ),
    );
  }
}
