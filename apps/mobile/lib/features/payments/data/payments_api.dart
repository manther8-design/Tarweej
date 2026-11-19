import 'package:dio/dio.dart';
import 'package:tarweej_mobile/features/payments/domain/payment_models.dart';

class PaymentsApiException implements Exception {
  PaymentsApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}

class PaymentsApi {
  PaymentsApi(this._dio);

  final Dio _dio;

  Future<List<PricingPlan>> listPlans({String? countryId}) async {
    try {
      final response = await _dio.get<List<dynamic>>(
        '/promotions/plans',
        queryParameters: <String, dynamic>{
          if (countryId != null) 'countryId': countryId,
        },
      );
      final data = response.data ?? <dynamic>[];
      return data
          .whereType<Map<String, dynamic>>()
          .map(PricingPlan.fromJson)
          .toList(growable: false);
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  Future<PurchaseResult> purchase({
    required String accessToken,
    required String listingId,
    required String pricingRuleId,
    required String idempotencyKey,
    int? durationHours,
  }) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/promotions/purchase',
        data: <String, dynamic>{
          'listingId': listingId,
          'pricingRuleId': pricingRuleId,
          'idempotencyKey': idempotencyKey,
          if (durationHours != null) 'durationHours': durationHours,
        },
        options: Options(headers: <String, dynamic>{'Authorization': 'Bearer $accessToken'}),
      );
      final data = response.data;
      if (data == null) {
        throw PaymentsApiException('Empty purchase response');
      }
      return PurchaseResult.fromJson(data);
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  Future<PaymentCompletionResult> mockComplete({
    required String accessToken,
    required String paymentId,
    String outcome = 'paid',
  }) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/payments/$paymentId/mock-complete',
        data: <String, dynamic>{'outcome': outcome},
        options: Options(headers: <String, dynamic>{'Authorization': 'Bearer $accessToken'}),
      );
      final data = response.data;
      if (data == null) {
        throw PaymentsApiException('Empty payment completion response');
      }
      return PaymentCompletionResult.fromJson(data);
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  Future<PaymentRecord> getPayment({
    required String accessToken,
    required String paymentId,
  }) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        '/payments/$paymentId',
        options: Options(headers: <String, dynamic>{'Authorization': 'Bearer $accessToken'}),
      );
      final data = response.data;
      if (data == null) {
        throw PaymentsApiException('Empty payment response');
      }
      return PaymentRecord.fromJson(data);
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  PaymentsApiException _mapError(DioException error) {
    final status = error.response?.statusCode;
    final data = error.response?.data;
    if (data is Map<String, dynamic>) {
      final message = data['message'];
      if (message is String) {
        return PaymentsApiException(message, statusCode: status);
      }
      if (message is List && message.isNotEmpty) {
        return PaymentsApiException(message.first.toString(), statusCode: status);
      }
    }
    return PaymentsApiException(
      error.message ?? 'Payments request failed',
      statusCode: status,
    );
  }
}
