import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:tarweej_mobile/core/network/api_client.dart';
import 'package:tarweej_mobile/features/auth/application/auth_controller.dart';
import 'package:tarweej_mobile/features/listings/data/listings_api.dart';
import 'package:tarweej_mobile/features/listings/domain/listing_models.dart';

final listingsApiProvider = Provider<ListingsApi>((ref) {
  return ListingsApi(ref.watch(dioProvider));
});

@immutable
class ListingsState {
  const ListingsState({
    this.loading = false,
    this.mine = const <ListingSummary>[],
    this.detail,
    this.error,
  });

  final bool loading;
  final List<ListingSummary> mine;
  final ListingDetail? detail;
  final String? error;

  ListingsState copyWith({
    bool? loading,
    List<ListingSummary>? mine,
    ListingDetail? detail,
    String? error,
    bool clearError = false,
    bool clearDetail = false,
  }) {
    return ListingsState(
      loading: loading ?? this.loading,
      mine: mine ?? this.mine,
      detail: clearDetail ? null : (detail ?? this.detail),
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class ListingsController extends Notifier<ListingsState> {
  @override
  ListingsState build() => const ListingsState();

  String? get _token => ref.read(authControllerProvider).tokens?.accessToken;

  Future<void> loadMine() async {
    final token = _token;
    if (token == null) {
      state = state.copyWith(error: 'Sign in required', mine: const <ListingSummary>[]);
      return;
    }
    state = state.copyWith(loading: true, clearError: true);
    try {
      final page = await ref.read(listingsApiProvider).listMine(accessToken: token);
      state = state.copyWith(loading: false, mine: page.items, clearError: true);
    } on ListingsApiException catch (error) {
      state = state.copyWith(loading: false, error: error.message);
    } catch (error) {
      state = state.copyWith(loading: false, error: error.toString());
    }
  }

  Future<void> loadPublicDetail(String id, {bool recordView = true}) async {
    state = state.copyWith(loading: true, clearError: true);
    try {
      final detail = await ref.read(listingsApiProvider).getPublic(id);
      if (recordView) {
        try {
          await ref.read(listingsApiProvider).recordView(id);
        } catch (_) {
          // view counter is best-effort
        }
      }
      state = state.copyWith(loading: false, detail: detail, clearError: true);
    } on ListingsApiException catch (error) {
      state = state.copyWith(loading: false, error: error.message);
    } catch (error) {
      state = state.copyWith(loading: false, error: error.toString());
    }
  }

  Future<void> loadMineDetail(String id) async {
    final token = _token;
    if (token == null) {
      state = state.copyWith(error: 'Sign in required');
      return;
    }
    state = state.copyWith(loading: true, clearError: true);
    try {
      final detail = await ref.read(listingsApiProvider).getMine(id, accessToken: token);
      state = state.copyWith(loading: false, detail: detail, clearError: true);
    } on ListingsApiException catch (error) {
      state = state.copyWith(loading: false, error: error.message);
    } catch (error) {
      state = state.copyWith(loading: false, error: error.toString());
    }
  }

  Future<ListingDetail?> createAndSubmit({
    required String categoryId,
    required String countryId,
    required String title,
    required String description,
    required double priceAmount,
    required String currencyCode,
    required List<Map<String, dynamic>> attributes,
    List<int>? mediaStubBytes,
  }) async {
    final token = _token;
    if (token == null) {
      state = state.copyWith(error: 'Sign in required');
      return null;
    }
    state = state.copyWith(loading: true, clearError: true);
    try {
      final api = ref.read(listingsApiProvider);
      final draft = await api.createDraft(
        accessToken: token,
        body: <String, dynamic>{
          'categoryId': categoryId,
          'countryId': countryId,
          'title': title,
          'description': description,
          'priceAmount': priceAmount,
          'currencyCode': currencyCode,
          'attributes': attributes,
        },
      );

      // 1x1 PNG stub when no picker bytes provided.
      final bytes = mediaStubBytes ??
          <int>[
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48,
            0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x06, 0x00, 0x00,
            0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41, 0x54, 0x78,
            0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
            0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82,
          ];
      await api.uploadMediaStub(
        accessToken: token,
        listingId: draft.id,
        bytes: bytes,
      );

      final submitted = await api.submit(accessToken: token, id: draft.id);
      await loadMine();
      state = state.copyWith(loading: false, detail: submitted, clearError: true);
      return submitted;
    } on ListingsApiException catch (error) {
      state = state.copyWith(loading: false, error: error.message);
      return null;
    } catch (error) {
      state = state.copyWith(loading: false, error: error.toString());
      return null;
    }
  }
}

final listingsControllerProvider =
    NotifierProvider<ListingsController, ListingsState>(ListingsController.new);
