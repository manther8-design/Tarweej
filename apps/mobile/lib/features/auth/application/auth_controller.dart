import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:tarweej_mobile/core/network/api_client.dart';
import 'package:tarweej_mobile/features/auth/data/auth_api.dart';
import 'package:tarweej_mobile/features/auth/data/session_store.dart';
import 'package:tarweej_mobile/features/auth/domain/auth_models.dart';

class AuthState {
  const AuthState({
    this.user,
    this.tokens,
    this.sessionId,
    this.bootstrapped = false,
    this.loading = false,
    this.error,
  });

  final UserProfile? user;
  final AuthTokens? tokens;
  final String? sessionId;
  final bool bootstrapped;
  final bool loading;
  final String? error;

  bool get isAuthenticated => tokens?.accessToken.isNotEmpty == true;

  AuthState copyWith({
    UserProfile? user,
    AuthTokens? tokens,
    String? sessionId,
    bool? bootstrapped,
    bool? loading,
    String? error,
    bool clearError = false,
    bool clearSession = false,
  }) {
    return AuthState(
      user: clearSession ? null : (user ?? this.user),
      tokens: clearSession ? null : (tokens ?? this.tokens),
      sessionId: clearSession ? null : (sessionId ?? this.sessionId),
      bootstrapped: bootstrapped ?? this.bootstrapped,
      loading: loading ?? this.loading,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

final sharedPreferencesProvider = FutureProvider<SharedPreferences>((ref) {
  return SharedPreferences.getInstance();
});

final sessionStoreProvider = Provider<SessionStore?>((ref) {
  final prefs = ref.watch(sharedPreferencesProvider).asData?.value;
  if (prefs == null) {
    return null;
  }
  return SessionStore(prefs);
});

final authApiProvider = Provider<AuthApi>((ref) {
  return AuthApi(ref.watch(dioProvider));
});

class AuthController extends StateNotifier<AuthState> {
  AuthController(this._ref) : super(const AuthState()) {
    _bootstrap();
  }

  final Ref _ref;

  Future<void> _bootstrap() async {
    final prefs = await SharedPreferences.getInstance();
    final store = SessionStore(prefs);
    final tokens = store.readTokens();
    final user = store.readUser();
    final sessionId = store.readSessionId();

    if (tokens == null) {
      state = state.copyWith(bootstrapped: true, clearSession: true, clearError: true);
      return;
    }

    state = state.copyWith(
      tokens: tokens,
      user: user,
      sessionId: sessionId,
      bootstrapped: true,
      clearError: true,
    );

    try {
      final me = await _ref.read(authApiProvider).me(tokens.accessToken);
      await store.save(
        AuthResult(user: me, tokens: tokens, sessionId: sessionId ?? ''),
      );
      state = state.copyWith(user: me, clearError: true);
    } on AuthApiException {
      try {
        final refreshed = await _ref.read(authApiProvider).refresh(tokens.refreshToken);
        await store.save(refreshed);
        state = state.copyWith(
          user: refreshed.user,
          tokens: refreshed.tokens,
          sessionId: refreshed.sessionId,
          clearError: true,
        );
      } catch (_) {
        await store.clear();
        state = state.copyWith(bootstrapped: true, clearSession: true);
      }
    }
  }

  Future<bool> register({
    required String email,
    required String password,
    String? displayName,
  }) async {
    return _runAuth(() {
      return _ref.read(authApiProvider).register(
            email: email,
            password: password,
            displayName: displayName,
          );
    });
  }

  Future<bool> login({
    required String email,
    required String password,
  }) async {
    return _runAuth(() {
      return _ref.read(authApiProvider).login(email: email, password: password);
    });
  }

  Future<bool> requestOtp(String phoneE164) async {
    state = state.copyWith(loading: true, clearError: true);
    try {
      await _ref.read(authApiProvider).requestOtp(phoneE164);
      state = state.copyWith(loading: false);
      return true;
    } on AuthApiException catch (error) {
      state = state.copyWith(loading: false, error: error.message);
      return false;
    } catch (error) {
      state = state.copyWith(loading: false, error: error.toString());
      return false;
    }
  }

  Future<bool> verifyOtp({
    required String phoneE164,
    required String code,
  }) async {
    return _runAuth(() {
      return _ref.read(authApiProvider).verifyOtp(phoneE164: phoneE164, code: code);
    });
  }

  Future<bool> updateProfile({
    required String displayName,
    String? preferredLanguageCode,
  }) async {
    final access = state.tokens?.accessToken;
    if (access == null) {
      return false;
    }
    state = state.copyWith(loading: true, clearError: true);
    try {
      final profile = await _ref.read(authApiProvider).updateProfile(
            accessToken: access,
            displayName: displayName,
            preferredLanguageCode: preferredLanguageCode,
          );
      final prefs = await SharedPreferences.getInstance();
      final store = SessionStore(prefs);
      final tokens = state.tokens!;
      await store.save(
        AuthResult(
          user: profile,
          tokens: tokens,
          sessionId: state.sessionId ?? '',
        ),
      );
      state = state.copyWith(user: profile, loading: false, clearError: true);
      return true;
    } on AuthApiException catch (error) {
      state = state.copyWith(loading: false, error: error.message);
      return false;
    }
  }

  Future<void> logout() async {
    final access = state.tokens?.accessToken;
    final prefs = await SharedPreferences.getInstance();
    final store = SessionStore(prefs);
    if (access != null) {
      try {
        await _ref.read(authApiProvider).logout(access);
      } catch (_) {
        // Local logout still proceeds.
      }
    }
    await store.clear();
    state = const AuthState(bootstrapped: true);
  }

  Future<bool> _runAuth(Future<AuthResult> Function() action) async {
    state = state.copyWith(loading: true, clearError: true);
    try {
      final result = await action();
      final prefs = await SharedPreferences.getInstance();
      await SessionStore(prefs).save(result);
      state = state.copyWith(
        user: result.user,
        tokens: result.tokens,
        sessionId: result.sessionId,
        loading: false,
        bootstrapped: true,
        clearError: true,
      );
      return true;
    } on AuthApiException catch (error) {
      state = state.copyWith(loading: false, error: error.message);
      return false;
    } catch (error, stack) {
      debugPrint('auth error: $error\n$stack');
      state = state.copyWith(loading: false, error: error.toString());
      return false;
    }
  }
}

final authControllerProvider =
    StateNotifierProvider<AuthController, AuthState>((ref) => AuthController(ref));
