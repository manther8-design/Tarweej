import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:tarweej_mobile/features/search/domain/search_models.dart';

class SearchApiException implements Exception {
  SearchApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}

class SearchApi {
  SearchApi(this._dio);

  final Dio _dio;

  Future<SearchPageResult> searchListings(SearchQuery query) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        '/search/listings',
        queryParameters: <String, dynamic>{
          if (query.q != null && query.q!.trim().isNotEmpty) 'q': query.q!.trim(),
          if (query.categoryId != null && query.categoryId!.isNotEmpty)
            'categoryId': query.categoryId,
          if (query.cityId != null && query.cityId!.isNotEmpty) 'cityId': query.cityId,
          if (query.countryId != null && query.countryId!.isNotEmpty)
            'countryId': query.countryId,
          if (query.minPrice != null) 'minPrice': query.minPrice,
          if (query.maxPrice != null) 'maxPrice': query.maxPrice,
          if (query.featured != null) 'featured': query.featured,
          'sort': query.sort,
          'page': query.page,
          'pageSize': query.pageSize,
          if (query.attributes.isNotEmpty)
            'attrs': jsonEncode(
              query.attributes.map((a) => a.toJson()).toList(growable: false),
            ),
        },
      );
      final data = response.data;
      if (data == null) {
        throw SearchApiException('Empty search response');
      }
      return SearchPageResult.fromJson(data);
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  SearchApiException _mapError(DioException error) {
    final status = error.response?.statusCode;
    final data = error.response?.data;
    if (data is Map<String, dynamic>) {
      final message = data['message'];
      if (message is String) {
        return SearchApiException(message, statusCode: status);
      }
      if (message is List && message.isNotEmpty) {
        return SearchApiException(message.first.toString(), statusCode: status);
      }
    }
    return SearchApiException(
      error.message ?? 'Search request failed',
      statusCode: status,
    );
  }
}
