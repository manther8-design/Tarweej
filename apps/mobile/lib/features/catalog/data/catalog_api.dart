import 'package:dio/dio.dart';
import 'package:tarweej_mobile/features/catalog/domain/catalog_models.dart';

class CatalogApiException implements Exception {
  CatalogApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}

class CatalogApi {
  CatalogApi(this._dio);

  final Dio _dio;

  Future<List<CatalogCategory>> listCategories({String? lang}) async {
    try {
      final response = await _dio.get<List<dynamic>>(
        '/categories',
        queryParameters: <String, dynamic>{
          if (lang != null && lang.isNotEmpty) 'lang': lang,
        },
      );
      final data = response.data ?? <dynamic>[];
      return data
          .whereType<Map<String, dynamic>>()
          .map(CatalogCategory.fromJson)
          .toList(growable: false);
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  Future<CatalogCategoryDetail> getCategory(String id, {String? lang}) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        '/categories/$id',
        queryParameters: <String, dynamic>{
          if (lang != null && lang.isNotEmpty) 'lang': lang,
        },
      );
      final data = response.data;
      if (data == null) {
        throw CatalogApiException('Empty category response');
      }
      return CatalogCategoryDetail.fromJson(data);
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  CatalogApiException _mapError(DioException error) {
    final status = error.response?.statusCode;
    final data = error.response?.data;
    if (data is Map<String, dynamic>) {
      final message = data['message'];
      if (message is String) {
        return CatalogApiException(message, statusCode: status);
      }
      if (message is List && message.isNotEmpty) {
        return CatalogApiException(message.first.toString(), statusCode: status);
      }
    }
    return CatalogApiException(
      error.message ?? 'Catalog request failed',
      statusCode: status,
    );
  }
}
