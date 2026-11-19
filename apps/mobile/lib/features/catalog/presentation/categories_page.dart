import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:tarweej_mobile/features/catalog/application/catalog_controller.dart';
import 'package:tarweej_mobile/features/catalog/domain/catalog_models.dart';
import 'package:tarweej_mobile/l10n/app_localizations.dart';

class CategoriesPage extends ConsumerWidget {
  const CategoriesPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final catalog = ref.watch(catalogControllerProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.categoriesTitle),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.goNamed('home'),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(catalogControllerProvider.notifier).loadTree(),
        child: _buildBody(context, ref, l10n, catalog),
      ),
    );
  }

  Widget _buildBody(
    BuildContext context,
    WidgetRef ref,
    AppLocalizations l10n,
    CatalogState catalog,
  ) {
    if (catalog.loading && catalog.roots.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: const [
          SizedBox(height: 120),
          Center(child: CircularProgressIndicator()),
        ],
      );
    }

    if (catalog.error != null && catalog.roots.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(24),
        children: [
          Text(catalog.error!),
          const SizedBox(height: 16),
          FilledButton(
            onPressed: () => ref.read(catalogControllerProvider.notifier).loadTree(),
            child: Text(l10n.categoriesRetry),
          ),
        ],
      );
    }

    if (catalog.roots.isEmpty) {
      return ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(24),
        children: [Text(l10n.categoriesEmpty)],
      );
    }

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(vertical: 8),
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
          child: Text(
            l10n.categoriesSubtitle,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ),
        ..._flatten(catalog.roots).map(
          (entry) => ListTile(
            contentPadding: EdgeInsetsDirectional.only(
              start: 16.0 + entry.depth * 16.0,
              end: 16,
            ),
            title: Text(entry.category.name),
            subtitle: Text(entry.category.slug),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => context.goNamed(
              'category-detail',
              pathParameters: <String, String>{'id': entry.category.id},
            ),
          ),
        ),
      ],
    );
  }

  List<_CategoryEntry> _flatten(List<CatalogCategory> roots, {int depth = 0}) {
    final result = <_CategoryEntry>[];
    for (final category in roots) {
      result.add(_CategoryEntry(category: category, depth: depth));
      result.addAll(_flatten(category.children, depth: depth + 1));
    }
    return result;
  }
}

class _CategoryEntry {
  const _CategoryEntry({required this.category, required this.depth});

  final CatalogCategory category;
  final int depth;
}
