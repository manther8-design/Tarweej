import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:tarweej_mobile/features/catalog/application/catalog_controller.dart';
import 'package:tarweej_mobile/features/catalog/domain/catalog_models.dart';
import 'package:tarweej_mobile/features/search/application/search_controller.dart';
import 'package:tarweej_mobile/l10n/app_localizations.dart';
import 'package:tarweej_mobile/shared/widgets/async_state_views.dart';
import 'package:tarweej_mobile/shared/widgets/listing_card.dart';
import 'package:tarweej_mobile/shared/widgets/marketplace_background.dart';

class SearchPage extends ConsumerStatefulWidget {
  const SearchPage({super.key});

  @override
  ConsumerState<SearchPage> createState() => _SearchPageState();
}

class _SearchPageState extends ConsumerState<SearchPage> {
  final _queryController = TextEditingController();
  final _minPriceController = TextEditingController();
  final _maxPriceController = TextEditingController();
  bool _filtersExpanded = false;

  static const _sortKeys = <String>[
    'newest',
    'oldest',
    'price_asc',
    'price_desc',
    'views',
    'featured',
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(searchControllerProvider.notifier).bootstrap();
    });
  }

  @override
  void dispose() {
    _queryController.dispose();
    _minPriceController.dispose();
    _maxPriceController.dispose();
    super.dispose();
  }

  List<CatalogCategory> _flatten(List<CatalogCategory> roots) {
    final out = <CatalogCategory>[];
    void walk(CatalogCategory node) {
      out.add(node);
      for (final child in node.children) {
        walk(child);
      }
    }

    for (final root in roots) {
      walk(root);
    }
    return out;
  }

  String _sortLabel(AppLocalizations l10n, String key) {
    switch (key) {
      case 'oldest':
        return l10n.searchSortOldest;
      case 'price_asc':
        return l10n.searchSortPriceAsc;
      case 'price_desc':
        return l10n.searchSortPriceDesc;
      case 'views':
        return l10n.searchSortViews;
      case 'featured':
        return l10n.searchSortFeatured;
      case 'newest':
      default:
        return l10n.searchSortNewest;
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final state = ref.watch(searchControllerProvider);
    final catalog = ref.watch(catalogControllerProvider);
    final categories = _flatten(catalog.roots);
    final controller = ref.read(searchControllerProvider.notifier);
    final result = state.result;
    final citiesById = {
      for (final city in state.cities) city.id: city.name,
    };

    return MarketplaceBackground(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(title: Text(l10n.searchTitle)),
        body: ListView(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
          children: [
            TextField(
              controller: _queryController,
              textInputAction: TextInputAction.search,
              decoration: InputDecoration(
                labelText: l10n.searchQueryLabel,
                hintText: l10n.searchQueryHint,
                prefixIcon: const Icon(Icons.search_rounded),
                suffixIcon: IconButton(
                  tooltip: l10n.searchAction,
                  onPressed: () async {
                    await controller.setQueryText(_queryController.text);
                    await controller.search(page: 1);
                  },
                  icon: const Icon(Icons.arrow_forward_rounded),
                ),
              ),
              onSubmitted: (value) async {
                await controller.setQueryText(value);
                await controller.search(page: 1);
              },
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: DropdownButtonFormField<String>(
                    value: state.query.sort,
                    decoration: InputDecoration(labelText: l10n.searchSortLabel),
                    items: _sortKeys
                        .map(
                          (key) => DropdownMenuItem<String>(
                            value: key,
                            child: Text(_sortLabel(l10n, key)),
                          ),
                        )
                        .toList(growable: false),
                    onChanged: (value) {
                      if (value != null) {
                        controller.setSort(value);
                      }
                    },
                  ),
                ),
                const SizedBox(width: 12),
                TextButton.icon(
                  onPressed: () => setState(() => _filtersExpanded = !_filtersExpanded),
                  icon: Icon(_filtersExpanded ? Icons.expand_less : Icons.tune),
                  label: Text(l10n.searchFiltersAction),
                ),
              ],
            ),
            if (_filtersExpanded) ...[
              const SizedBox(height: 12),
              DropdownButtonFormField<String?>(
                value: state.query.categoryId,
                decoration: InputDecoration(labelText: l10n.searchCategoryLabel),
                items: <DropdownMenuItem<String?>>[
                  DropdownMenuItem<String?>(
                    value: null,
                    child: Text(l10n.searchAnyOption),
                  ),
                  ...categories.map(
                    (c) => DropdownMenuItem<String?>(
                      value: c.id,
                      child: Text(c.name),
                    ),
                  ),
                ],
                onChanged: (value) => controller.setCategory(value),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String?>(
                value: state.query.cityId,
                decoration: InputDecoration(labelText: l10n.searchCityLabel),
                items: <DropdownMenuItem<String?>>[
                  DropdownMenuItem<String?>(
                    value: null,
                    child: Text(l10n.searchAnyOption),
                  ),
                  ...state.cities.map(
                    (c) => DropdownMenuItem<String?>(
                      value: c.id,
                      child: Text(c.name),
                    ),
                  ),
                ],
                onChanged: (value) => controller.setCity(value),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _minPriceController,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(labelText: l10n.searchMinPriceLabel),
                      onChanged: (_) {
                        final min = double.tryParse(_minPriceController.text);
                        final max = double.tryParse(_maxPriceController.text);
                        controller.setPriceRange(min: min, max: max);
                      },
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextField(
                      controller: _maxPriceController,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(labelText: l10n.searchMaxPriceLabel),
                      onChanged: (_) {
                        final min = double.tryParse(_minPriceController.text);
                        final max = double.tryParse(_maxPriceController.text);
                        controller.setPriceRange(min: min, max: max);
                      },
                    ),
                  ),
                ],
              ),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(l10n.searchFeaturedOnly),
                value: state.query.featured == true,
                onChanged: (value) => controller.setFeatured(value ? true : null),
              ),
              if (state.categoryAttributes.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(
                  l10n.searchAttributesHeading,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 8),
                ...state.categoryAttributes.map((attr) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: _AttributeFilterField(
                      attribute: attr,
                      textValue: state.attrText[attr.attributeDefinitionId],
                      minValue: state.attrMin[attr.attributeDefinitionId],
                      maxValue: state.attrMax[attr.attributeDefinitionId],
                      boolValue: state.attrBool[attr.attributeDefinitionId],
                      onText: (v) => controller.setAttrText(attr.attributeDefinitionId, v),
                      onMin: (v) => controller.setAttrMin(attr.attributeDefinitionId, v),
                      onMax: (v) => controller.setAttrMax(attr.attributeDefinitionId, v),
                      onBool: (v) => controller.setAttrBool(attr.attributeDefinitionId, v),
                    ),
                  );
                }),
              ],
              Align(
                alignment: AlignmentDirectional.centerEnd,
                child: FilledButton(
                  onPressed: state.loading
                      ? null
                      : () async {
                          await controller.setQueryText(_queryController.text);
                          final min = double.tryParse(_minPriceController.text);
                          final max = double.tryParse(_maxPriceController.text);
                          await controller.setPriceRange(min: min, max: max);
                          await controller.search(page: 1);
                        },
                  child: Text(l10n.searchApplyFilters),
                ),
              ),
            ],
            const SizedBox(height: 16),
            if (state.loading && (result == null || result.items.isEmpty))
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 48),
                child: MarketplaceLoadingView(),
              )
            else if (state.error != null && (result == null || result.items.isEmpty))
              MarketplaceErrorView(
                message: state.error!,
                retryLabel: l10n.homeFeedRetry,
                onRetry: () => controller.search(page: 1),
              )
            else if (result != null) ...[
              Text(
                l10n.searchResultsCount(result.total),
                style: Theme.of(context).textTheme.titleMedium,
              ),
              if (result.cached)
                Text(
                  l10n.searchCachedHint,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              const SizedBox(height: 12),
              if (result.items.isEmpty)
                MarketplaceEmptyView(
                  title: l10n.searchEmpty,
                  icon: Icons.search_off_rounded,
                )
              else
                ...result.items.map((hit) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: ListingCard(
                      dense: true,
                      data: ListingCardData(
                        id: hit.id,
                        title: hit.title,
                        priceAmount: hit.priceAmount,
                        currencyCode: hit.currencyCode,
                        coverImageUrl: hit.coverImageUrl,
                        isFeatured: hit.isFeaturedCached,
                        locationLabel: hit.cityId == null
                            ? null
                            : citiesById[hit.cityId!],
                        subtitle: '${l10n.listingViewsLabel}: ${hit.viewCount}',
                      ),
                      onTap: () => context.goNamed(
                        'listing-detail',
                        pathParameters: <String, String>{'id': hit.id},
                      ),
                    ),
                  );
                }),
              if (result.total > result.pageSize)
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    TextButton(
                      onPressed: result.page <= 1 || state.loading
                          ? null
                          : () => controller.search(page: result.page - 1),
                      child: Text(l10n.searchPrevPage),
                    ),
                    Text('${result.page}'),
                    TextButton(
                      onPressed:
                          (result.page * result.pageSize >= result.total) || state.loading
                              ? null
                              : () => controller.search(page: result.page + 1),
                      child: Text(l10n.searchNextPage),
                    ),
                  ],
                ),
            ],
          ],
        ),
      ),
    );
  }
}

class _AttributeFilterField extends StatelessWidget {
  const _AttributeFilterField({
    required this.attribute,
    required this.onText,
    required this.onMin,
    required this.onMax,
    required this.onBool,
    this.textValue,
    this.minValue,
    this.maxValue,
    this.boolValue,
  });

  final CatalogAttribute attribute;
  final String? textValue;
  final String? minValue;
  final String? maxValue;
  final bool? boolValue;
  final ValueChanged<String> onText;
  final ValueChanged<String> onMin;
  final ValueChanged<String> onMax;
  final ValueChanged<bool?> onBool;

  @override
  Widget build(BuildContext context) {
    final dataType = attribute.dataType;
    if (dataType == 'bool') {
      return DropdownButtonFormField<bool?>(
        value: boolValue,
        decoration: InputDecoration(labelText: attribute.name),
        items: const <DropdownMenuItem<bool?>>[
          DropdownMenuItem<bool?>(value: null, child: Text('—')),
          DropdownMenuItem<bool?>(value: true, child: Text('true')),
          DropdownMenuItem<bool?>(value: false, child: Text('false')),
        ],
        onChanged: onBool,
      );
    }
    if (dataType == 'number' || dataType == 'int' || dataType == 'decimal') {
      return Row(
        children: [
          Expanded(
            child: TextFormField(
              initialValue: minValue ?? '',
              decoration: InputDecoration(labelText: '${attribute.name} min'),
              keyboardType: TextInputType.number,
              onChanged: onMin,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: TextFormField(
              initialValue: maxValue ?? '',
              decoration: InputDecoration(labelText: '${attribute.name} max'),
              keyboardType: TextInputType.number,
              onChanged: onMax,
            ),
          ),
        ],
      );
    }
    if (attribute.options.isNotEmpty) {
      return DropdownButtonFormField<String?>(
        value: textValue,
        decoration: InputDecoration(labelText: attribute.name),
        items: <DropdownMenuItem<String?>>[
          const DropdownMenuItem<String?>(value: null, child: Text('—')),
          ...attribute.options.map(
            (o) => DropdownMenuItem<String?>(value: o.value, child: Text(o.label)),
          ),
        ],
        onChanged: (value) => onText(value ?? ''),
      );
    }
    return TextFormField(
      initialValue: textValue ?? '',
      decoration: InputDecoration(labelText: attribute.name),
      onChanged: onText,
    );
  }
}
