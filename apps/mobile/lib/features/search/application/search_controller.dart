import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:tarweej_mobile/core/network/api_client.dart';
import 'package:tarweej_mobile/features/catalog/application/catalog_controller.dart';
import 'package:tarweej_mobile/features/catalog/domain/catalog_models.dart';
import 'package:tarweej_mobile/features/reference/application/reference_controller.dart';
import 'package:tarweej_mobile/features/reference/data/reference_api.dart';
import 'package:tarweej_mobile/features/reference/domain/reference_models.dart';
import 'package:tarweej_mobile/features/search/data/search_api.dart';
import 'package:tarweej_mobile/features/search/domain/search_models.dart';

final searchApiProvider = Provider<SearchApi>((ref) {
  return SearchApi(ref.watch(dioProvider));
});

@immutable
class SearchUiState {
  const SearchUiState({
    this.loading = false,
    this.query = const SearchQuery(),
    this.result,
    this.error,
    this.cities = const <ReferenceCity>[],
    this.categoryAttributes = const <CatalogAttribute>[],
    this.attrText = const <String, String>{},
    this.attrMin = const <String, String>{},
    this.attrMax = const <String, String>{},
    this.attrBool = const <String, bool>{},
  });

  final bool loading;
  final SearchQuery query;
  final SearchPageResult? result;
  final String? error;
  final List<ReferenceCity> cities;
  final List<CatalogAttribute> categoryAttributes;
  final Map<String, String> attrText;
  final Map<String, String> attrMin;
  final Map<String, String> attrMax;
  final Map<String, bool> attrBool;

  SearchUiState copyWith({
    bool? loading,
    SearchQuery? query,
    SearchPageResult? result,
    String? error,
    List<ReferenceCity>? cities,
    List<CatalogAttribute>? categoryAttributes,
    Map<String, String>? attrText,
    Map<String, String>? attrMin,
    Map<String, String>? attrMax,
    Map<String, bool>? attrBool,
    bool clearError = false,
    bool clearResult = false,
  }) {
    return SearchUiState(
      loading: loading ?? this.loading,
      query: query ?? this.query,
      result: clearResult ? null : (result ?? this.result),
      error: clearError ? null : (error ?? this.error),
      cities: cities ?? this.cities,
      categoryAttributes: categoryAttributes ?? this.categoryAttributes,
      attrText: attrText ?? this.attrText,
      attrMin: attrMin ?? this.attrMin,
      attrMax: attrMax ?? this.attrMax,
      attrBool: attrBool ?? this.attrBool,
    );
  }
}

class SearchController extends Notifier<SearchUiState> {
  @override
  SearchUiState build() {
    final countryId = ref.read(referenceControllerProvider).selectedCountryId;
    return SearchUiState(
      query: SearchQuery(countryId: countryId),
    );
  }

  Future<void> bootstrap() async {
    final countryId = ref.read(referenceControllerProvider).selectedCountryId;
    state = state.copyWith(
      query: state.query.copyWith(countryId: countryId),
    );
    await Future.wait(<Future<void>>[
      ref.read(catalogControllerProvider.notifier).loadTree(),
      _loadCities(),
      search(),
    ]);
  }

  Future<void> _loadCities() async {
    final countryId = state.query.countryId;
    if (countryId == null || countryId.isEmpty) {
      state = state.copyWith(cities: const <ReferenceCity>[]);
      return;
    }
    try {
      final cities = await ref.read(referenceApiProvider).listCities(countryId: countryId);
      state = state.copyWith(cities: cities);
    } on ReferenceApiException {
      state = state.copyWith(cities: const <ReferenceCity>[]);
    }
  }

  Future<void> setQueryText(String value) async {
    state = state.copyWith(query: state.query.copyWith(q: value, page: 1));
  }

  Future<void> setSort(String sort) async {
    state = state.copyWith(query: state.query.copyWith(sort: sort, page: 1));
    await search();
  }

  Future<void> setCategory(String? categoryId) async {
    state = state.copyWith(
      query: state.query.copyWith(
        categoryId: categoryId,
        page: 1,
        clearCategory: categoryId == null,
        attributes: const <SearchAttributeFilter>[],
      ),
      attrText: const <String, String>{},
      attrMin: const <String, String>{},
      attrMax: const <String, String>{},
      attrBool: const <String, bool>{},
      categoryAttributes: const <CatalogAttribute>[],
    );
    if (categoryId != null && categoryId.isNotEmpty) {
      try {
        final detail = await ref.read(catalogApiProvider).getCategory(categoryId);
        state = state.copyWith(categoryAttributes: detail.attributes);
      } catch (_) {
        state = state.copyWith(categoryAttributes: const <CatalogAttribute>[]);
      }
    }
    await search();
  }

  Future<void> setCity(String? cityId) async {
    state = state.copyWith(
      query: state.query.copyWith(cityId: cityId, page: 1, clearCity: cityId == null),
    );
    await search();
  }

  Future<void> setPriceRange({double? min, double? max}) async {
    state = state.copyWith(
      query: state.query.copyWith(
        minPrice: min,
        maxPrice: max,
        page: 1,
        clearMinPrice: min == null,
        clearMaxPrice: max == null,
      ),
    );
  }

  Future<void> setFeatured(bool? featured) async {
    state = state.copyWith(
      query: state.query.copyWith(
        featured: featured,
        page: 1,
        clearFeatured: featured == null,
      ),
    );
    await search();
  }

  void setAttrText(String attributeDefinitionId, String value) {
    final next = Map<String, String>.from(state.attrText);
    if (value.trim().isEmpty) {
      next.remove(attributeDefinitionId);
    } else {
      next[attributeDefinitionId] = value.trim();
    }
    state = state.copyWith(attrText: next);
  }

  void setAttrMin(String attributeDefinitionId, String value) {
    final next = Map<String, String>.from(state.attrMin);
    if (value.trim().isEmpty) {
      next.remove(attributeDefinitionId);
    } else {
      next[attributeDefinitionId] = value.trim();
    }
    state = state.copyWith(attrMin: next);
  }

  void setAttrMax(String attributeDefinitionId, String value) {
    final next = Map<String, String>.from(state.attrMax);
    if (value.trim().isEmpty) {
      next.remove(attributeDefinitionId);
    } else {
      next[attributeDefinitionId] = value.trim();
    }
    state = state.copyWith(attrMax: next);
  }

  void setAttrBool(String attributeDefinitionId, bool? value) {
    final next = Map<String, bool>.from(state.attrBool);
    if (value == null) {
      next.remove(attributeDefinitionId);
    } else {
      next[attributeDefinitionId] = value;
    }
    state = state.copyWith(attrBool: next);
  }

  List<SearchAttributeFilter> _buildAttributeFilters() {
    final filters = <SearchAttributeFilter>[];
    final ids = <String>{
      ...state.attrText.keys,
      ...state.attrMin.keys,
      ...state.attrMax.keys,
      ...state.attrBool.keys,
    };
    for (final id in ids) {
      final minRaw = state.attrMin[id];
      final maxRaw = state.attrMax[id];
      filters.add(
        SearchAttributeFilter(
          attributeDefinitionId: id,
          eq: state.attrText[id],
          min: minRaw == null ? null : double.tryParse(minRaw),
          max: maxRaw == null ? null : double.tryParse(maxRaw),
          boolValue: state.attrBool[id],
        ),
      );
    }
    return filters
        .where(
          (f) =>
              f.eq != null || f.min != null || f.max != null || f.boolValue != null,
        )
        .toList(growable: false);
  }

  Future<void> search({int? page}) async {
    final nextQuery = state.query.copyWith(
      page: page ?? state.query.page,
      attributes: _buildAttributeFilters(),
    );
    state = state.copyWith(loading: true, query: nextQuery, clearError: true);
    try {
      final result = await ref.read(searchApiProvider).searchListings(nextQuery);
      state = state.copyWith(loading: false, result: result, clearError: true);
    } on SearchApiException catch (error) {
      state = state.copyWith(loading: false, error: error.message, clearResult: true);
    } catch (error) {
      state = state.copyWith(loading: false, error: error.toString(), clearResult: true);
    }
  }
}

final searchControllerProvider =
    NotifierProvider<SearchController, SearchUiState>(SearchController.new);
