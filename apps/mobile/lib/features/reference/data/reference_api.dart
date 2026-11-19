import 'package:dio/dio.dart';
import 'package:tarweej_mobile/features/reference/domain/reference_models.dart';

class ReferenceApiException implements Exception {
  ReferenceApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}

class ReferenceApi {
  ReferenceApi(this._dio);

  final Dio _dio;

  Future<List<ReferenceCountry>> listCountries({String? lang}) async {
    try {
      final response = await _dio.get<List<dynamic>>(
        '/reference/countries',
        queryParameters: <String, dynamic>{
          if (lang != null && lang.isNotEmpty) 'lang': lang,
        },
      );
      final data = response.data ?? <dynamic>[];
      return data
          .whereType<Map<String, dynamic>>()
          .map(ReferenceCountry.fromJson)
          .toList(growable: false);
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  Future<List<ReferenceCity>> listCities({
    required String countryId,
    String? lang,
  }) async {
    try {
      final response = await _dio.get<List<dynamic>>(
        '/reference/cities',
        queryParameters: <String, dynamic>{
          'countryId': countryId,
          if (lang != null && lang.isNotEmpty) 'lang': lang,
        },
      );
      final data = response.data ?? <dynamic>[];
      return data
          .whereType<Map<String, dynamic>>()
          .map(ReferenceCity.fromJson)
          .toList(growable: false);
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  ReferenceApiException _mapError(DioException error) {
    final status = error.response?.statusCode;
    final data = error.response?.data;
    if (data is Map<String, dynamic>) {
      final message = data['message'];
      if (message is String) {
        return ReferenceApiException(message, statusCode: status);
      }
      if (message is List && message.isNotEmpty) {
        return ReferenceApiException(message.first.toString(), statusCode: status);
      }
    }
    return ReferenceApiException(
      error.message ?? 'Reference request failed',
      statusCode: status,
    );
  }
}
