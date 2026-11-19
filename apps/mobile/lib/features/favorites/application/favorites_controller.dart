import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:tarweej_mobile/core/network/api_client.dart';
import 'package:tarweej_mobile/features/auth/application/auth_controller.dart';
import 'package:tarweej_mobile/features/favorites/data/favorites_api.dart';
import 'package:tarweej_mobile/features/favorites/domain/favorite_models.dart';

final favoritesApiProvider = Provider<FavoritesApi>((ref) {
  return FavoritesApi(ref.watch(dioProvider));
});

@immutable
class FavoritesUiState {
  const FavoritesUiState({
    this.loading = false,
    this.items = const <FavoriteItem>[],
    this.error,
    this.actionError,
  });

  final bool loading;
  final List<FavoriteItem> items;
  final String? error;
  final String? actionError;

  FavoritesUiState copyWith({
    bool? loading,
    List<FavoriteItem>? items,
    String? error,
    String? actionError,
    bool clearError = false,
    bool clearActionError = false,
  }) {
    return FavoritesUiState(
      loading: loading ?? this.loading,
      items: items ?? this.items,
      error: clearError ? null : (error ?? this.error),
      actionError: clearActionError ? null : (actionError ?? this.actionError),
    );
  }
}

class FavoritesController extends Notifier<FavoritesUiState> {
  @override
  FavoritesUiState build() => const FavoritesUiState();

  String? get _token => ref.read(authControllerProvider).tokens?.accessToken;

  Future<void> load() async {
    final token = _token;
    if (token == null) {
      state = state.copyWith(error: 'Not signed in', loading: false);
      return;
    }
    state = state.copyWith(loading: true, clearError: true, clearActionError: true);
    try {
      final page = await ref.read(favoritesApiProvider).list(accessToken: token);
      state = state.copyWith(loading: false, items: page.items, clearError: true);
    } on FavoritesApiException catch (error) {
      state = state.copyWith(loading: false, error: error.message);
    } catch (error) {
      state = state.copyWith(loading: false, error: error.toString());
    }
  }

  Future<void> add(String listingId) async {
    final token = _token;
    if (token == null) {
      state = state.copyWith(actionError: 'Not signed in');
      return;
    }
    try {
      await ref.read(favoritesApiProvider).add(accessToken: token, listingId: listingId);
      await load();
    } on FavoritesApiException catch (error) {
      state = state.copyWith(actionError: error.message);
    }
  }

  Future<void> remove(String listingId) async {
    final token = _token;
    if (token == null) {
      state = state.copyWith(actionError: 'Not signed in');
      return;
    }
    try {
      await ref.read(favoritesApiProvider).remove(accessToken: token, listingId: listingId);
      await load();
    } on FavoritesApiException catch (error) {
      state = state.copyWith(actionError: error.message);
    }
  }
}

final favoritesControllerProvider =
    NotifierProvider<FavoritesController, FavoritesUiState>(FavoritesController.new);
