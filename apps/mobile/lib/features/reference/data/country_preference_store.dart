import 'package:shared_preferences/shared_preferences.dart';

class CountryPreferenceStore {
  CountryPreferenceStore(this._prefs);

  final SharedPreferences _prefs;

  static const _countryIdKey = 'reference.selected_country_id';
  static const _countryIso2Key = 'reference.selected_country_iso2';
  static const _countryNameKey = 'reference.selected_country_name';

  String? get countryId => _prefs.getString(_countryIdKey);
  String? get countryIso2 => _prefs.getString(_countryIso2Key);
  String? get countryName => _prefs.getString(_countryNameKey);

  bool get hasSelection => countryId != null && countryId!.isNotEmpty;

  Future<void> save({
    required String id,
    required String iso2,
    required String name,
  }) async {
    await _prefs.setString(_countryIdKey, id);
    await _prefs.setString(_countryIso2Key, iso2);
    await _prefs.setString(_countryNameKey, name);
  }

  Future<void> clear() async {
    await _prefs.remove(_countryIdKey);
    await _prefs.remove(_countryIso2Key);
    await _prefs.remove(_countryNameKey);
  }
}
