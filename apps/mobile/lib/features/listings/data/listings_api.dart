import 'package:dio/dio.dart';
import 'package:tarweej_mobile/features/listings/domain/listing_models.dart';

class ListingsApiException implements Exception {
  ListingsApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}

class ListingsApi {
  ListingsApi(this._dio);

  final Dio _dio;

  Future<ListingPage> listMine({
    required String accessToken,
    String? status,
  }) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        '/my/listings',
        queryParameters: <String, dynamic>{
          if (status != null && status.isNotEmpty) 'status': status,
        },
        options: Options(headers: <String, dynamic>{'Authorization': 'Bearer $accessToken'}),
      );
      final data = response.data;
      if (data == null) {
        throw ListingsApiException('Empty listings response');
      }
      return ListingPage.fromJson(data);
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  Future<ListingDetail> getMine(String id, {required String accessToken}) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        '/my/listings/$id',
        options: Options(headers: <String, dynamic>{'Authorization': 'Bearer $accessToken'}),
      );
      final data = response.data;
      if (data == null) {
        throw ListingsApiException('Empty listing response');
      }
      return ListingDetail.fromJson(data);
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  Future<ListingDetail> getPublic(String id) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>('/listings/$id');
      final data = response.data;
      if (data == null) {
        throw ListingsApiException('Empty listing response');
      }
      return ListingDetail.fromJson(data);
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  Future<ListingDetail> createDraft({
    required String accessToken,
    required Map<String, dynamic> body,
  }) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/my/listings',
        data: body,
        options: Options(headers: <String, dynamic>{'Authorization': 'Bearer $accessToken'}),
      );
      final data = response.data;
      if (data == null) {
        throw ListingsApiException('Empty create response');
      }
      return ListingDetail.fromJson(data);
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  Future<ListingDetail> updateDraft({
    required String accessToken,
    required String id,
    required Map<String, dynamic> body,
  }) async {
    try {
      final response = await _dio.patch<Map<String, dynamic>>(
        '/my/listings/$id',
        data: body,
        options: Options(headers: <String, dynamic>{'Authorization': 'Bearer $accessToken'}),
      );
      final data = response.data;
      if (data == null) {
        throw ListingsApiException('Empty update response');
      }
      return ListingDetail.fromJson(data);
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  Future<ListingDetail> submit({
    required String accessToken,
    required String id,
  }) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/my/listings/$id/submit',
        options: Options(headers: <String, dynamic>{'Authorization': 'Bearer $accessToken'}),
      );
      final data = response.data;
      if (data == null) {
        throw ListingsApiException('Empty submit response');
      }
      return ListingDetail.fromJson(data);
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  /// Media stub: records a placeholder upload intent without a real binary picker
  /// in unit/widget environments. Production wizard can attach FormData files.
  Future<void> uploadMediaStub({
    required String accessToken,
    required String listingId,
    required List<int> bytes,
    String filename = 'stub.png',
  }) async {
    try {
      final form = FormData.fromMap(<String, dynamic>{
        'file': MultipartFile.fromBytes(bytes, filename: filename),
      });
      await _dio.post<Map<String, dynamic>>(
        '/my/listings/$listingId/media',
        data: form,
        options: Options(
          headers: <String, dynamic>{
            'Authorization': 'Bearer $accessToken',
            'Content-Type': 'multipart/form-data',
          },
        ),
      );
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  Future<void> recordView(String id) async {
    try {
      await _dio.post<Map<String, dynamic>>('/listings/$id/views', data: <String, dynamic>{});
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  ListingsApiException _mapError(DioException error) {
    final status = error.response?.statusCode;
    final data = error.response?.data;
    if (data is Map<String, dynamic>) {
      final message = data['message'];
      if (message is String) {
        return ListingsApiException(message, statusCode: status);
      }
      if (message is List && message.isNotEmpty) {
        return ListingsApiException(message.first.toString(), statusCode: status);
      }
    }
    return ListingsApiException(
      error.message ?? 'Listings request failed',
      statusCode: status,
    );
  }
}
