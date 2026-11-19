import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:tarweej_mobile/core/network/api_client.dart';
import 'package:tarweej_mobile/features/auth/application/auth_controller.dart';
import 'package:tarweej_mobile/features/chat/data/chat_api.dart';
import 'package:tarweej_mobile/features/chat/domain/chat_models.dart';

final chatApiProvider = Provider<ChatApi>((ref) {
  return ChatApi(ref.watch(dioProvider));
});

@immutable
class ChatListUiState {
  const ChatListUiState({
    this.loading = false,
    this.items = const <ConversationSummary>[],
    this.error,
  });

  final bool loading;
  final List<ConversationSummary> items;
  final String? error;

  ChatListUiState copyWith({
    bool? loading,
    List<ConversationSummary>? items,
    String? error,
    bool clearError = false,
  }) {
    return ChatListUiState(
      loading: loading ?? this.loading,
      items: items ?? this.items,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class ChatListController extends Notifier<ChatListUiState> {
  @override
  ChatListUiState build() => const ChatListUiState();

  Future<void> load() async {
    final token = ref.read(authControllerProvider).tokens?.accessToken;
    if (token == null) {
      state = state.copyWith(error: 'Not signed in', loading: false);
      return;
    }
    state = state.copyWith(loading: true, clearError: true);
    try {
      final page = await ref.read(chatApiProvider).listConversations(accessToken: token);
      state = state.copyWith(loading: false, items: page.items, clearError: true);
    } on ChatApiException catch (error) {
      state = state.copyWith(loading: false, error: error.message);
    } catch (error) {
      state = state.copyWith(loading: false, error: error.toString());
    }
  }

  Future<String?> openForListing(String listingId) async {
    final token = ref.read(authControllerProvider).tokens?.accessToken;
    if (token == null) {
      state = state.copyWith(error: 'Not signed in');
      return null;
    }
    try {
      final opened = await ref.read(chatApiProvider).openConversation(
            accessToken: token,
            listingId: listingId,
          );
      return opened.id;
    } on ChatApiException catch (error) {
      state = state.copyWith(error: error.message);
      return null;
    }
  }
}

final chatListControllerProvider =
    NotifierProvider<ChatListController, ChatListUiState>(ChatListController.new);

@immutable
class ChatThreadUiState {
  const ChatThreadUiState({
    this.loading = false,
    this.sending = false,
    this.messages = const <ChatMessage>[],
    this.error,
  });

  final bool loading;
  final bool sending;
  final List<ChatMessage> messages;
  final String? error;

  ChatThreadUiState copyWith({
    bool? loading,
    bool? sending,
    List<ChatMessage>? messages,
    String? error,
    bool clearError = false,
  }) {
    return ChatThreadUiState(
      loading: loading ?? this.loading,
      sending: sending ?? this.sending,
      messages: messages ?? this.messages,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class ChatThreadController extends Notifier<ChatThreadUiState> {
  @override
  ChatThreadUiState build() => const ChatThreadUiState();

  Future<void> load(String conversationId) async {
    final token = ref.read(authControllerProvider).tokens?.accessToken;
    if (token == null) {
      state = state.copyWith(error: 'Not signed in', loading: false);
      return;
    }
    state = state.copyWith(loading: true, clearError: true);
    try {
      final api = ref.read(chatApiProvider);
      final page = await api.listMessages(accessToken: token, conversationId: conversationId);
      await api.markRead(accessToken: token, conversationId: conversationId);
      state = state.copyWith(loading: false, messages: page.items, clearError: true);
    } on ChatApiException catch (error) {
      state = state.copyWith(loading: false, error: error.message);
    } catch (error) {
      state = state.copyWith(loading: false, error: error.toString());
    }
  }

  Future<bool> send(String conversationId, String body) async {
    final token = ref.read(authControllerProvider).tokens?.accessToken;
    if (token == null) {
      state = state.copyWith(error: 'Not signed in');
      return false;
    }
    final trimmed = body.trim();
    if (trimmed.isEmpty) {
      return false;
    }
    state = state.copyWith(sending: true, clearError: true);
    try {
      final message = await ref.read(chatApiProvider).sendMessage(
            accessToken: token,
            conversationId: conversationId,
            body: trimmed,
          );
      state = state.copyWith(
        sending: false,
        messages: <ChatMessage>[...state.messages, message],
      );
      return true;
    } on ChatApiException catch (error) {
      state = state.copyWith(sending: false, error: error.message);
      return false;
    }
  }
}

final chatThreadControllerProvider =
    NotifierProvider<ChatThreadController, ChatThreadUiState>(ChatThreadController.new);
