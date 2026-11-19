import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:tarweej_mobile/features/catalog/application/catalog_controller.dart';
import 'package:tarweej_mobile/l10n/app_localizations.dart';

class CategoryDetailPage extends ConsumerStatefulWidget {
  const CategoryDetailPage({required this.categoryId, super.key});

  final String categoryId;

  @override
  ConsumerState<CategoryDetailPage> createState() => _CategoryDetailPageState();
}

class _CategoryDetailPageState extends ConsumerState<CategoryDetailPage> {
  @override
  void initState() {
    super.initState();
    Future<void>.microtask(() {
      ref.read(catalogControllerProvider.notifier).selectCategory(widget.categoryId);
    });
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final catalog = ref.watch(catalogControllerProvider);
    final detail = catalog.selected;

    return Scaffold(
      appBar: AppBar(
        title: Text(detail?.name ?? l10n.categoryDetailTitle),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.goNamed('categories'),
        ),
      ),
      body: catalog.loading && detail == null
          ? const Center(child: CircularProgressIndicator())
          : catalog.error != null && detail == null
              ? Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(catalog.error!),
                      const SizedBox(height: 16),
                      FilledButton(
                        onPressed: () => ref
                            .read(catalogControllerProvider.notifier)
                            .selectCategory(widget.categoryId),
                        child: Text(l10n.categoriesRetry),
                      ),
                    ],
                  ),
                )
              : detail == null
                  ? Center(child: Text(l10n.categoriesEmpty))
                  : ListView(
                      padding: const EdgeInsets.all(24),
                      children: [
                        Text(
                          detail.name,
                          style: Theme.of(context).textTheme.headlineSmall,
                        ),
                        const SizedBox(height: 8),
                        Text('${l10n.categorySlugLabel}: ${detail.slug}'),
                        const SizedBox(height: 4),
                        Text('${l10n.categoryListingTypeLabel}: ${detail.listingType}'),
                        const SizedBox(height: 24),
                        Text(
                          l10n.categoryAttributesHeading,
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        const SizedBox(height: 12),
                        if (detail.attributes.isEmpty)
                          Text(l10n.categoryAttributesEmpty)
                        else
                          ...detail.attributes.map(
                            (attr) => Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    '${attr.name}${attr.isRequired ? ' *' : ''}',
                                    style: Theme.of(context).textTheme.titleSmall,
                                  ),
                                  Text(
                                    '${attr.dataType}${attr.unit != null ? ' (${attr.unit})' : ''}',
                                    style: Theme.of(context).textTheme.bodySmall,
                                  ),
                                  if (attr.options.isNotEmpty)
                                    Padding(
                                      padding: const EdgeInsets.only(top: 4),
                                      child: Text(
                                        attr.options.map((o) => o.label).join(' · '),
                                        style: Theme.of(context).textTheme.bodyMedium,
                                      ),
                                    ),
                                ],
                              ),
                            ),
                          ),
                      ],
                    ),
    );
  }
}
