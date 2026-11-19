import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:tarweej_mobile/core/network/api_client.dart';
import 'package:tarweej_mobile/features/catalog/data/catalog_api.dart';
import 'package:tarweej_mobile/features/catalog/domain/catalog_models.dart';

final catalogApiProvider = Provider<CatalogApi>((ref) {
  return CatalogApi(ref.watch(dioProvider));
});

@immutable
class CatalogState {
  const CatalogState({
    this.loading = false,
    this.roots = const <CatalogCategory>[],
    this.selected,
    this.error,
  });

  final bool loading;
  final List<CatalogCategory> roots;
  final CatalogCategoryDetail? selected;
  final String? error;

  CatalogState copyWith({
    bool? loading,
    List<CatalogCategory>? roots,
    CatalogCategoryDetail? selected,
    String? error,
    bool clearError = false,
    bool clearSelected = false,
  }) {
    return CatalogState(
      loading: loading ?? this.loading,
      roots: roots ?? this.roots,
      selected: clearSelected ? null : (selected ?? this.selected),
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class CatalogController extends Notifier<CatalogState> {
  @override
  CatalogState build() {
    Future<void>.microtask(loadTree);
    return const CatalogState(loading: true);
  }

  Future<void> loadTree({String? lang}) async {
    state = state.copyWith(loading: true, clearError: true);
    try {
      final locale = lang ?? WidgetsBinding.instance.platformDispatcher.locale.languageCode;
      final roots = await ref.read(catalogApiProvider).listCategories(lang: locale);
      state = state.copyWith(loading: false, roots: roots, clearError: true);
    } on CatalogApiException catch (error) {
      state = state.copyWith(loading: false, error: error.message);
    } catch (error) {
      state = state.copyWith(loading: false, error: error.toString());
    }
  }

  Future<void> selectCategory(String id, {String? lang}) async {
    state = state.copyWith(loading: true, clearError: true);
    try {
      final locale = lang ?? WidgetsBinding.instance.platformDispatcher.locale.languageCode;
      final detail = await ref.read(catalogApiProvider).getCategory(id, lang: locale);
      state = state.copyWith(loading: false, selected: detail, clearError: true);
    } on CatalogApiException catch (error) {
      state = state.copyWith(loading: false, error: error.message);
    } catch (error) {
      state = state.copyWith(loading: false, error: error.toString());
    }
  }

  void clearSelection() {
    state = state.copyWith(clearSelected: true);
  }
}

final catalogControllerProvider =
    NotifierProvider<CatalogController, CatalogState>(CatalogController.new);
