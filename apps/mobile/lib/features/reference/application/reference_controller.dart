import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:tarweej_mobile/core/network/api_client.dart';
import 'package:tarweej_mobile/features/auth/application/auth_controller.dart';
import 'package:tarweej_mobile/features/reference/data/country_preference_store.dart';
import 'package:tarweej_mobile/features/reference/data/reference_api.dart';
import 'package:tarweej_mobile/features/reference/domain/reference_models.dart';

final referenceApiProvider = Provider<ReferenceApi>((ref) {
  return ReferenceApi(ref.watch(dioProvider));
});

final countryPreferenceStoreProvider = Provider<CountryPreferenceStore?>((ref) {
  final prefs = ref.watch(sharedPreferencesProvider).asData?.value;
  if (prefs == null) {
    return null;
  }
  return CountryPreferenceStore(prefs);
});

@immutable
class ReferenceState {
  const ReferenceState({
    this.bootstrapped = false,
    this.loading = false,
    this.countries = const <ReferenceCountry>[],
    this.selectedCountryId,
    this.selectedCountryIso2,
    this.selectedCountryName,
    this.error,
  });

  final bool bootstrapped;
  final bool loading;
  final List<ReferenceCountry> countries;
  final String? selectedCountryId;
  final String? selectedCountryIso2;
  final String? selectedCountryName;
  final String? error;

  bool get hasCountry =>
      selectedCountryId != null && selectedCountryId!.isNotEmpty;

  ReferenceState copyWith({
    bool? bootstrapped,
    bool? loading,
    List<ReferenceCountry>? countries,
    String? selectedCountryId,
    String? selectedCountryIso2,
    String? selectedCountryName,
    String? error,
    bool clearError = false,
    bool clearSelection = false,
  }) {
    return ReferenceState(
      bootstrapped: bootstrapped ?? this.bootstrapped,
      loading: loading ?? this.loading,
      countries: countries ?? this.countries,
      selectedCountryId:
          clearSelection ? null : (selectedCountryId ?? this.selectedCountryId),
      selectedCountryIso2: clearSelection
          ? null
          : (selectedCountryIso2 ?? this.selectedCountryIso2),
      selectedCountryName: clearSelection
          ? null
          : (selectedCountryName ?? this.selectedCountryName),
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class ReferenceController extends Notifier<ReferenceState> {
  @override
  ReferenceState build() {
    Future<void>.microtask(_bootstrap);
    return const ReferenceState();
  }

  Future<void> _bootstrap() async {
    final prefs = await SharedPreferences.getInstance();
    final store = CountryPreferenceStore(prefs);
    state = state.copyWith(
      bootstrapped: true,
      selectedCountryId: store.countryId,
      selectedCountryIso2: store.countryIso2,
      selectedCountryName: store.countryName,
      clearError: true,
    );
  }

  Future<void> loadCountries({String lang = 'ar'}) async {
    state = state.copyWith(loading: true, clearError: true);
    try {
      final countries = await ref.read(referenceApiProvider).listCountries(lang: lang);
      state = state.copyWith(loading: false, countries: countries);
    } on ReferenceApiException catch (error) {
      state = state.copyWith(loading: false, error: error.message);
    } catch (_) {
      state = state.copyWith(loading: false, error: 'Failed to load countries');
    }
  }

  Future<void> selectCountry(ReferenceCountry country) async {
    final prefs = await SharedPreferences.getInstance();
    final store = CountryPreferenceStore(prefs);
    await store.save(id: country.id, iso2: country.iso2, name: country.name);
    state = state.copyWith(
      selectedCountryId: country.id,
      selectedCountryIso2: country.iso2,
      selectedCountryName: country.name,
      clearError: true,
    );
  }
}

final referenceControllerProvider =
    NotifierProvider<ReferenceController, ReferenceState>(ReferenceController.new);
