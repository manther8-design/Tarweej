import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:tarweej_mobile/features/auth/application/auth_controller.dart';
import 'package:tarweej_mobile/features/catalog/application/catalog_controller.dart';
import 'package:tarweej_mobile/features/reference/application/reference_controller.dart';
import 'package:tarweej_mobile/l10n/app_localizations.dart';

class HomePage extends ConsumerWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final auth = ref.watch(authControllerProvider);
    final reference = ref.watch(referenceControllerProvider);
    final catalog = ref.watch(catalogControllerProvider);
    final name = auth.user?.displayName ?? auth.user?.email ?? l10n.guestLabel;
    final countryLabel = reference.selectedCountryName ??
        reference.selectedCountryIso2 ??
        l10n.countrySelectTitle;
    final topCategories = catalog.roots.take(6).toList(growable: false);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.appTitle),
        actions: [
          IconButton(
            tooltip: l10n.searchTitle,
            onPressed: () => context.goNamed('search'),
            icon: const Icon(Icons.search),
          ),
          IconButton(
            tooltip: l10n.categoriesTitle,
            onPressed: () => context.goNamed('categories'),
            icon: const Icon(Icons.category_outlined),
          ),
          IconButton(
            tooltip: l10n.countrySelectTitle,
            onPressed: () => context.goNamed('country'),
            icon: const Icon(Icons.public),
          ),
          IconButton(
            tooltip: l10n.profileTitle,
            onPressed: () => context.goNamed('profile'),
            icon: const Icon(Icons.person_outline),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              l10n.homeHeadline,
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 12),
            Text(l10n.homeBody),
            const SizedBox(height: 16),
            Text('${l10n.signedInAs}: $name'),
            const SizedBox(height: 8),
            Text('${l10n.selectedCountryLabel}: $countryLabel'),
            const SizedBox(height: 24),
            Text(
              l10n.homeCategoriesHeading,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            if (catalog.loading && topCategories.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 12),
                child: LinearProgressIndicator(),
              )
            else if (catalog.error != null && topCategories.isEmpty)
              Text(catalog.error!)
            else if (topCategories.isEmpty)
              Text(l10n.categoriesEmpty)
            else
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: topCategories
                    .map(
                      (category) => ActionChip(
                        label: Text(category.name),
                        onPressed: () => context.goNamed(
                          'category-detail',
                          pathParameters: <String, String>{'id': category.id},
                        ),
                      ),
                    )
                    .toList(growable: false),
              ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: () => context.goNamed('search'),
              child: Text(l10n.openSearchAction),
            ),
            const SizedBox(height: 12),
            FilledButton.tonal(
              onPressed: () => context.goNamed('categories'),
              child: Text(l10n.browseCategoriesAction),
            ),
            const SizedBox(height: 12),
            FilledButton.tonal(
              onPressed: () => context.goNamed('my-listings'),
              child: Text(l10n.openMyListings),
            ),
            const SizedBox(height: 12),
            FilledButton.tonal(
              onPressed: () => context.goNamed('favorites'),
              child: Text(l10n.openFavorites),
            ),
            const SizedBox(height: 12),
            FilledButton.tonal(
              onPressed: () => context.goNamed('chat'),
              child: Text(l10n.openChat),
            ),
            const SizedBox(height: 12),
            FilledButton.tonal(
              onPressed: () => context.goNamed('notifications'),
              child: Text(l10n.openNotifications),
            ),
            const SizedBox(height: 12),
            FilledButton.tonal(
              onPressed: () => context.goNamed('profile'),
              child: Text(l10n.openProfile),
            ),
            const SizedBox(height: 12),
            OutlinedButton(
              onPressed: () => context.goNamed('country'),
              child: Text(l10n.changeCountryAction),
            ),
          ],
        ),
      ),
    );
  }
}
