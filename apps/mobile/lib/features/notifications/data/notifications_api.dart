import 'package:dio/dio.dart';
import 'package:tarweej_mobile/features/notifications/domain/notification_models.dart';

class NotificationsApiException implements Exception {
  NotificationsApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}

class NotificationsApi {
  NotificationsApi(this._dio);

  final Dio _dio;

  Future<NotificationPage> list({required String accessToken}) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        '/notifications',
        options: Options(headers: <String, dynamic>{'Authorization': 'Bearer $accessToken'}),
      );
      final data = response.data;
      if (data == null) {
        throw NotificationsApiException('Empty notifications response');
      }
      return NotificationPage.fromJson(data);
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  Future<int> unreadCount({required String accessToken}) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        '/notifications/unread-count',
        options: Options(headers: <String, dynamic>{'Authorization': 'Bearer $accessToken'}),
      );
      return (response.data?['unreadCount'] as num?)?.toInt() ?? 0;
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  Future<void> markRead({required String accessToken, required String id}) async {
    try {
      await _dio.post<Map<String, dynamic>>(
        '/notifications/$id/read',
        options: Options(headers: <String, dynamic>{'Authorization': 'Bearer $accessToken'}),
      );
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  Future<void> markAllRead({required String accessToken}) async {
    try {
      await _dio.post<Map<String, dynamic>>(
        '/notifications/read-all',
        options: Options(headers: <String, dynamic>{'Authorization': 'Bearer $accessToken'}),
      );
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  NotificationsApiException _mapError(DioException error) {
    final status = error.response?.statusCode;
    final data = error.response?.data;
    if (data is Map<String, dynamic>) {
      final message = data['message'];
      if (message is String) {
        return NotificationsApiException(message, statusCode: status);
      }
      if (message is List && message.isNotEmpty) {
        return NotificationsApiException(message.first.toString(), statusCode: status);
      }
    }
    return NotificationsApiException(
      error.message ?? 'Notifications request failed',
      statusCode: status,
    );
  }
}
