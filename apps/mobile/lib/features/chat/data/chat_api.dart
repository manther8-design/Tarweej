import 'package:dio/dio.dart';
import 'package:tarweej_mobile/features/chat/domain/chat_models.dart';

class ChatApiException implements Exception {
  ChatApiException(this.message, {this.statusCode});

  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}

class ChatApi {
  ChatApi(this._dio);

  final Dio _dio;

  Future<ConversationPage> listConversations({required String accessToken}) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        '/conversations',
        options: Options(headers: <String, dynamic>{'Authorization': 'Bearer $accessToken'}),
      );
      final data = response.data;
      if (data == null) {
        throw ChatApiException('Empty conversations response');
      }
      return ConversationPage.fromJson(data);
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  Future<OpenedConversation> openConversation({
    required String accessToken,
    required String listingId,
  }) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/conversations',
        data: <String, dynamic>{'listingId': listingId},
        options: Options(headers: <String, dynamic>{'Authorization': 'Bearer $accessToken'}),
      );
      final data = response.data;
      if (data == null) {
        throw ChatApiException('Empty open conversation response');
      }
      return OpenedConversation.fromJson(data);
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  Future<ChatMessagePage> listMessages({
    required String accessToken,
    required String conversationId,
  }) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        '/conversations/$conversationId/messages',
        options: Options(headers: <String, dynamic>{'Authorization': 'Bearer $accessToken'}),
      );
      final data = response.data;
      if (data == null) {
        throw ChatApiException('Empty messages response');
      }
      return ChatMessagePage.fromJson(data);
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  Future<ChatMessage> sendMessage({
    required String accessToken,
    required String conversationId,
    required String body,
  }) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/conversations/$conversationId/messages',
        data: <String, dynamic>{'body': body},
        options: Options(headers: <String, dynamic>{'Authorization': 'Bearer $accessToken'}),
      );
      final data = response.data;
      if (data == null) {
        throw ChatApiException('Empty send message response');
      }
      return ChatMessage.fromJson(data);
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  Future<void> markRead({
    required String accessToken,
    required String conversationId,
  }) async {
    try {
      await _dio.post<Map<String, dynamic>>(
        '/conversations/$conversationId/read',
        options: Options(headers: <String, dynamic>{'Authorization': 'Bearer $accessToken'}),
      );
    } on DioException catch (error) {
      throw _mapError(error);
    }
  }

  ChatApiException _mapError(DioException error) {
    final status = error.response?.statusCode;
    final data = error.response?.data;
    if (data is Map<String, dynamic>) {
      final message = data['message'];
      if (message is String) {
        return ChatApiException(message, statusCode: status);
      }
      if (message is List && message.isNotEmpty) {
        return ChatApiException(message.first.toString(), statusCode: status);
      }
    }
    return ChatApiException(
      error.message ?? 'Chat request failed',
      statusCode: status,
    );
  }
}
