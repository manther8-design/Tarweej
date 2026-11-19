import 'package:dio/dio.dart';

class ReportsApiException implements Exception {
  ReportsApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}

class ReportsApi {
  ReportsApi(this._dio);

  final Dio _dio;

  Future<void> reportListing({
    required String accessToken,
    required String listingId,
    required String reasonCode,
    String? notes,
  }) async {
    try {
      await _dio.post<Map<String, dynamic>>(
        '/reports',
        data: <String, dynamic>{
          'listingId': listingId,
          'reasonCode': reasonCode,
          if (notes != null && notes.trim().isNotEmpty) 'notes': notes.trim(),
        },
        options: Options(headers: <String, dynamic>{'Authorization': 'Bearer $accessToken'}),
      );
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  ReportsApiException _mapError(DioException error) {
    final status = error.response?.statusCode;
    final data = error.response?.data;
    if (data is Map<String, dynamic>) {
      final message = data['message'];
      if (message is String) {
        return ReportsApiException(message, statusCode: status);
      }
      if (message is List && message.isNotEmpty) {
        return ReportsApiException(message.first.toString(), statusCode: status);
      }
    }
    return ReportsApiException(
      error.message ?? 'Report request failed',
      statusCode: status,
    );
  }
}
