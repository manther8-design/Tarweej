import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:tarweej_mobile/core/theme/tarweej_colors.dart';
import 'package:tarweej_mobile/features/catalog/application/catalog_controller.dart';
import 'package:tarweej_mobile/features/catalog/domain/catalog_models.dart';
import 'package:tarweej_mobile/l10n/app_localizations.dart';
import 'package:tarweej_mobile/shared/widgets/async_state_views.dart';
import 'package:tarweej_mobile/shared/widgets/marketplace_background.dart';

class CategoriesPage extends ConsumerWidget {
  const CategoriesPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final catalog = ref.watch(catalogControllerProvider);

    return MarketplaceBackground(
      child: Scaffold(
        backgroundColor: Colors.transparent,
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
      return const MarketplaceLoadingView();
    }

    if (catalog.error != null && catalog.roots.isEmpty) {
      return MarketplaceErrorView(
        message: catalog.error!,
        retryLabel: l10n.categoriesRetry,
        onRetry: () => ref.read(catalogControllerProvider.notifier).loadTree(),
      );
    }

    if (catalog.roots.isEmpty) {
      return MarketplaceEmptyView(title: l10n.categoriesEmpty);
    }

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
      children: [
        Text(
          l10n.categoriesSubtitle,
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        const SizedBox(height: 16),
        ...catalog.roots.map(
          (root) => _CategoryTile(
            category: root,
            depth: 0,
            onTap: (id) => context.goNamed(
              'category-detail',
              pathParameters: <String, String>{'id': id},
            ),
          ),
        ),
      ],
    );
  }
}

class _CategoryTile extends StatelessWidget {
  const _CategoryTile({
    required this.category,
    required this.depth,
    required this.onTap,
  });

  final CatalogCategory category;
  final int depth;
  final ValueChanged<String> onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsetsDirectional.only(start: depth * 12.0, bottom: 10),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => onTap(category.id),
          borderRadius: BorderRadius.circular(16),
          child: Ink(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.86),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: TarweejColors.line.withValues(alpha: 0.8)),
            ),
            child: Row(
              children: [
                Container(
                  width: 42,
                  height: 42,
                  decoration: BoxDecoration(
                    color: TarweejColors.teal.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    _iconFor(category.name),
                    color: TarweejColors.tealDeep,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        category.name,
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      Text(
                        category.slug,
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right_rounded),
              ],
            ),
          ),
        ),
      ),
    );
  }

  IconData _iconFor(String name) {
    final lower = name.toLowerCase();
    if (lower.contains('phone') || lower.contains('جوال')) {
      return Icons.smartphone_rounded;
    }
    if (lower.contains('car') || lower.contains('سيار')) {
      return Icons.directions_car_filled_rounded;
    }
    if (lower.contains('home') || lower.contains('عقار')) {
      return Icons.home_work_outlined;
    }
    return Icons.category_outlined;
  }
}
