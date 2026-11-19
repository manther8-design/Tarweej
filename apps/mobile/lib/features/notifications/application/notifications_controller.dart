import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:tarweej_mobile/core/network/api_client.dart';
import 'package:tarweej_mobile/features/auth/application/auth_controller.dart';
import 'package:tarweej_mobile/features/notifications/data/notifications_api.dart';
import 'package:tarweej_mobile/features/notifications/domain/notification_models.dart';

final notificationsApiProvider = Provider<NotificationsApi>((ref) {
  return NotificationsApi(ref.watch(dioProvider));
});

@immutable
class NotificationsUiState {
  const NotificationsUiState({
    this.loading = false,
    this.items = const <NotificationItem>[],
    this.unreadCount = 0,
    this.error,
  });

  final bool loading;
  final List<NotificationItem> items;
  final int unreadCount;
  final String? error;

  NotificationsUiState copyWith({
    bool? loading,
    List<NotificationItem>? items,
    int? unreadCount,
    String? error,
    bool clearError = false,
  }) {
    return NotificationsUiState(
      loading: loading ?? this.loading,
      items: items ?? this.items,
      unreadCount: unreadCount ?? this.unreadCount,
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class NotificationsController extends Notifier<NotificationsUiState> {
  @override
  NotificationsUiState build() => const NotificationsUiState();

  String? get _token => ref.read(authControllerProvider).tokens?.accessToken;

  Future<void> load() async {
    final token = _token;
    if (token == null) {
      state = state.copyWith(error: 'Not signed in', loading: false);
      return;
    }
    state = state.copyWith(loading: true, clearError: true);
    try {
      final api = ref.read(notificationsApiProvider);
      final page = await api.list(accessToken: token);
      final unread = await api.unreadCount(accessToken: token);
      state = state.copyWith(
        loading: false,
        items: page.items,
        unreadCount: unread,
        clearError: true,
      );
    } on NotificationsApiException catch (error) {
      state = state.copyWith(loading: false, error: error.message);
    } catch (error) {
      state = state.copyWith(loading: false, error: error.toString());
    }
  }

  Future<void> markRead(String id) async {
    final token = _token;
    if (token == null) {
      return;
    }
    try {
      await ref.read(notificationsApiProvider).markRead(accessToken: token, id: id);
      await load();
    } on NotificationsApiException catch (error) {
      state = state.copyWith(error: error.message);
    }
  }

  Future<void> markAllRead() async {
    final token = _token;
    if (token == null) {
      return;
    }
    try {
      await ref.read(notificationsApiProvider).markAllRead(accessToken: token);
      await load();
    } on NotificationsApiException catch (error) {
      state = state.copyWith(error: error.message);
    }
  }
}

final notificationsControllerProvider =
    NotifierProvider<NotificationsController, NotificationsUiState>(
  NotificationsController.new,
);
