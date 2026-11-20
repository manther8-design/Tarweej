import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:tarweej_mobile/features/catalog/application/catalog_controller.dart';
import 'package:tarweej_mobile/features/reference/application/reference_controller.dart';
import 'package:tarweej_mobile/features/reference/data/reference_api.dart';
import 'package:tarweej_mobile/features/reference/domain/reference_models.dart';
import 'package:tarweej_mobile/features/search/application/search_controller.dart';
import 'package:tarweej_mobile/features/search/data/search_api.dart';
import 'package:tarweej_mobile/features/search/domain/search_models.dart';

@immutable
class HomeFeedState {
  const HomeFeedState({
    this.loading = false,
    this.refreshing = false,
    this.items = const <SearchListingHit>[],
    this.cities = const <ReferenceCity>[],
    this.page = 1,
    this.total = 0,
    this.hasMore = false,
    this.error,
    this.selectedCategoryId,
  });

  final bool loading;
  final bool refreshing;
  final List<SearchListingHit> items;
  final List<ReferenceCity> cities;
  final int page;
  final int total;
  final bool hasMore;
  final String? error;
  final String? selectedCategoryId;

  String? cityNameFor(String? cityId) {
    if (cityId == null || cityId.isEmpty) {
      return null;
    }
    for (final city in cities) {
      if (city.id == cityId) {
        return city.name;
      }
    }
    return null;
  }

  HomeFeedState copyWith({
    bool? loading,
    bool? refreshing,
    List<SearchListingHit>? items,
    List<ReferenceCity>? cities,
    int? page,
    int? total,
    bool? hasMore,
    String? error,
    String? selectedCategoryId,
    bool clearError = false,
    bool clearCategory = false,
  }) {
    return HomeFeedState(
      loading: loading ?? this.loading,
      refreshing: refreshing ?? this.refreshing,
      items: items ?? this.items,
      cities: cities ?? this.cities,
      page: page ?? this.page,
      total: total ?? this.total,
      hasMore: hasMore ?? this.hasMore,
      error: clearError ? null : (error ?? this.error),
      selectedCategoryId:
          clearCategory ? null : (selectedCategoryId ?? this.selectedCategoryId),
    );
  }
}

class HomeFeedController extends Notifier<HomeFeedState> {
  static const int _pageSize = 20;

  @override
  HomeFeedState build() => const HomeFeedState();

  Future<void> bootstrap() async {
    await Future.wait(<Future<void>>[
      ref.read(catalogControllerProvider.notifier).loadTree(),
      _loadCities(),
    ]);
    await load(reset: true);
  }

  Future<void> _loadCities() async {
    final countryId = ref.read(referenceControllerProvider).selectedCountryId;
    if (countryId == null || countryId.isEmpty) {
      state = state.copyWith(cities: const <ReferenceCity>[]);
      return;
    }
    try {
      final cities =
          await ref.read(referenceApiProvider).listCities(countryId: countryId);
      state = state.copyWith(cities: cities);
    } on ReferenceApiException {
      state = state.copyWith(cities: const <ReferenceCity>[]);
    }
  }

  Future<void> selectCategory(String? categoryId) async {
    state = state.copyWith(
      selectedCategoryId: categoryId,
      clearCategory: categoryId == null,
    );
    await load(reset: true);
  }

  Future<void> refresh() async {
    state = state.copyWith(refreshing: true, clearError: true);
    await _loadCities();
    await load(reset: true, refreshing: true);
  }

  Future<void> loadMore() async {
    if (state.loading || !state.hasMore) {
      return;
    }
    await load(reset: false);
  }

  Future<void> load({bool reset = false, bool refreshing = false}) async {
    final nextPage = reset ? 1 : state.page + 1;
    final countryId = ref.read(referenceControllerProvider).selectedCountryId;
    state = state.copyWith(
      loading: !refreshing,
      refreshing: refreshing,
      clearError: true,
    );

    final query = SearchQuery(
      countryId: countryId,
      categoryId: state.selectedCategoryId,
      sort: 'featured',
      page: nextPage,
      pageSize: _pageSize,
    );

    try {
      final result = await ref.read(searchApiProvider).searchListings(query);
      final merged = reset
          ? result.items
          : <SearchListingHit>[...state.items, ...result.items];
      final hasMore = merged.length < result.total;
      state = state.copyWith(
        loading: false,
        refreshing: false,
        items: merged,
        page: result.page,
        total: result.total,
        hasMore: hasMore,
        clearError: true,
      );
    } on SearchApiException catch (error) {
      state = state.copyWith(
        loading: false,
        refreshing: false,
        error: error.message,
        items: reset ? const <SearchListingHit>[] : state.items,
      );
    } catch (error) {
      state = state.copyWith(
        loading: false,
        refreshing: false,
        error: error.toString(),
        items: reset ? const <SearchListingHit>[] : state.items,
      );
    }
  }
}

final homeFeedControllerProvider =
    NotifierProvider<HomeFeedController, HomeFeedState>(HomeFeedController.new);
