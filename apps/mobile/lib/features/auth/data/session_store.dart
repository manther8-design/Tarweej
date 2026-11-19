import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';
import 'package:tarweej_mobile/features/auth/domain/auth_models.dart';

class SessionStore {
  SessionStore(this._prefs);

  static const _tokensKey = 'identity.tokens';
  static const _userKey = 'identity.user';
  static const _sessionKey = 'identity.sessionId';

  final SharedPreferences _prefs;

  Future<void> save(AuthResult result) async {
    await _prefs.setString(_tokensKey, jsonEncode(result.tokens.toJson()));
    await _prefs.setString(_userKey, jsonEncode(result.user.toJson()));
    await _prefs.setString(_sessionKey, result.sessionId);
  }

  AuthTokens? readTokens() {
    final raw = _prefs.getString(_tokensKey);
    if (raw == null) {
      return null;
    }
    return AuthTokens.fromJson(jsonDecode(raw) as Map<String, dynamic>);
  }

  UserProfile? readUser() {
    final raw = _prefs.getString(_userKey);
    if (raw == null) {
      return null;
    }
    return UserProfile.fromJson(jsonDecode(raw) as Map<String, dynamic>);
  }

  String? readSessionId() => _prefs.getString(_sessionKey);

  bool get hasSession => readTokens()?.accessToken.isNotEmpty == true;

  Future<void> clear() async {
    await _prefs.remove(_tokensKey);
    await _prefs.remove(_userKey);
    await _prefs.remove(_sessionKey);
  }
}
