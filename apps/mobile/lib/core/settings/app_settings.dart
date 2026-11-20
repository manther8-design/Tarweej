import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

const _localeKey = 'settings.locale';
const _themeKey = 'settings.theme_mode';

class AppSettings {
  const AppSettings({
    this.localeCode = 'ar',
    this.themeMode = ThemeMode.system,
  });

  final String localeCode;
  final ThemeMode themeMode;

  Locale get locale => Locale(localeCode);

  AppSettings copyWith({String? localeCode, ThemeMode? themeMode}) {
    return AppSettings(
      localeCode: localeCode ?? this.localeCode,
      themeMode: themeMode ?? this.themeMode,
    );
  }
}

class AppSettingsController extends StateNotifier<AppSettings> {
  AppSettingsController() : super(const AppSettings()) {
    _hydrate();
  }

  Future<void> _hydrate() async {
    final prefs = await SharedPreferences.getInstance();
    final localeCode = prefs.getString(_localeKey) ?? 'ar';
    final themeRaw = prefs.getString(_themeKey) ?? ThemeMode.system.name;
    final themeMode = ThemeMode.values.firstWhere(
      (mode) => mode.name == themeRaw,
      orElse: () => ThemeMode.system,
    );
    state = AppSettings(localeCode: localeCode, themeMode: themeMode);
  }

  Future<void> setLocale(String code) async {
    state = state.copyWith(localeCode: code);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_localeKey, code);
  }

  Future<void> setThemeMode(ThemeMode mode) async {
    state = state.copyWith(themeMode: mode);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_themeKey, mode.name);
  }

  Future<void> toggleLocale() async {
    await setLocale(state.localeCode == 'ar' ? 'en' : 'ar');
  }
}

final appSettingsProvider =
    StateNotifierProvider<AppSettingsController, AppSettings>(
  (ref) => AppSettingsController(),
);
