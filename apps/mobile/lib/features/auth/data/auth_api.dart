import 'package:dio/dio.dart';
import 'package:tarweej_mobile/features/auth/domain/auth_models.dart';

class AuthApiException implements Exception {
  AuthApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}

class AuthApi {
  AuthApi(this._dio);

  final Dio _dio;

  Future<AuthResult> register({
    required String email,
    required String password,
    String? displayName,
  }) {
    return _authPost(
      '/identity/auth/register',
      <String, dynamic>{
        'email': email,
        'password': password,
        if (displayName != null && displayName.isNotEmpty) 'displayName': displayName,
        'deviceLabel': 'flutter',
      },
    );
  }

  Future<AuthResult> login({
    required String email,
    required String password,
  }) {
    return _authPost(
      '/identity/auth/login',
      <String, dynamic>{
        'email': email,
        'password': password,
        'deviceLabel': 'flutter',
      },
    );
  }

  Future<AuthResult> refresh(String refreshToken) {
    return _authPost(
      '/identity/auth/refresh',
      <String, dynamic>{'refreshToken': refreshToken},
    );
  }

  Future<void> logout(String accessToken) async {
    try {
      await _dio.post<void>(
        '/identity/auth/logout',
        options: Options(headers: <String, dynamic>{'Authorization': 'Bearer $accessToken'}),
      );
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  Future<UserProfile> me(String accessToken) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        '/identity/me',
        options: Options(headers: <String, dynamic>{'Authorization': 'Bearer $accessToken'}),
      );
      return UserProfile.fromJson(response.data!);
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  Future<UserProfile> updateProfile({
    required String accessToken,
    String? displayName,
    String? preferredLanguageCode,
  }) async {
    try {
      final response = await _dio.patch<Map<String, dynamic>>(
        '/identity/profile',
        data: <String, dynamic>{
          if (displayName != null) 'displayName': displayName,
          if (preferredLanguageCode != null) 'preferredLanguageCode': preferredLanguageCode,
        },
        options: Options(headers: <String, dynamic>{'Authorization': 'Bearer $accessToken'}),
      );
      return UserProfile.fromJson(response.data!);
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  Future<Map<String, dynamic>> requestOtp(String phoneE164) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/identity/otp/request',
        data: <String, dynamic>{'phoneE164': phoneE164},
      );
      return response.data!;
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  Future<AuthResult> verifyOtp({
    required String phoneE164,
    required String code,
  }) {
    return _authPost(
      '/identity/otp/verify',
      <String, dynamic>{
        'phoneE164': phoneE164,
        'code': code,
        'deviceLabel': 'flutter',
      },
    );
  }

  Future<AuthResult> _authPost(String path, Map<String, dynamic> body) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(path, data: body);
      return AuthResult.fromJson(response.data!);
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  AuthApiException _mapError(DioException error) {
    final data = error.response?.data;
    String message = 'Request failed';
    if (data is Map && data['message'] != null) {
      final raw = data['message'];
      if (raw is List) {
        message = raw.join(', ');
      } else {
        message = raw.toString();
      }
    } else if (error.message != null) {
      message = error.message!;
    }
    return AuthApiException(message, statusCode: error.response?.statusCode);
  }
}
