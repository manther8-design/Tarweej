import 'package:dio/dio.dart';
import 'package:tarweej_mobile/features/favorites/domain/favorite_models.dart';

class FavoritesApiException implements Exception {
  FavoritesApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}

class FavoritesApi {
  FavoritesApi(this._dio);

  final Dio _dio;

  Future<FavoritePage> list({required String accessToken}) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        '/favorites',
        options: Options(headers: <String, dynamic>{'Authorization': 'Bearer $accessToken'}),
      );
      final data = response.data;
      if (data == null) {
        throw FavoritesApiException('Empty favorites response');
      }
      return FavoritePage.fromJson(data);
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  Future<void> add({required String accessToken, required String listingId}) async {
    try {
      await _dio.post<Map<String, dynamic>>(
        '/favorites',
        data: <String, dynamic>{'listingId': listingId},
        options: Options(headers: <String, dynamic>{'Authorization': 'Bearer $accessToken'}),
      );
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  Future<void> remove({required String accessToken, required String listingId}) async {
    try {
      await _dio.delete<Map<String, dynamic>>(
        '/favorites/$listingId',
        options: Options(headers: <String, dynamic>{'Authorization': 'Bearer $accessToken'}),
      );
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  Future<bool> isFavorited({
    required String accessToken,
    required String listingId,
  }) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        '/favorites/status/$listingId',
        options: Options(headers: <String, dynamic>{'Authorization': 'Bearer $accessToken'}),
      );
      return response.data?['favorited'] == true;
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  FavoritesApiException _mapError(DioException error) {
    final status = error.response?.statusCode;
    final data = error.response?.data;
    if (data is Map<String, dynamic>) {
      final message = data['message'];
      if (message is String) {
        return FavoritesApiException(message, statusCode: status);
      }
      if (message is List && message.isNotEmpty) {
        return FavoritesApiException(message.first.toString(), statusCode: status);
      }
    }
    return FavoritesApiException(
      error.message ?? 'Favorites request failed',
      statusCode: status,
    );
  }
}
