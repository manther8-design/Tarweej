import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:tarweej_mobile/features/chat/application/chat_controller.dart';
import 'package:tarweej_mobile/l10n/app_localizations.dart';

class ChatListPage extends ConsumerStatefulWidget {
  const ChatListPage({super.key});

  @override
  ConsumerState<ChatListPage> createState() => _ChatListPageState();
}

class _ChatListPageState extends ConsumerState<ChatListPage> {
  @override
  void initState() {
    super.initState();
    Future<void>.microtask(() => ref.read(chatListControllerProvider.notifier).load());
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final state = ref.watch(chatListControllerProvider);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.chatTitle)),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: state.loading && state.items.isEmpty
            ? const Center(child: CircularProgressIndicator())
            : state.error != null && state.items.isEmpty
                ? Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(state.error!),
                      const SizedBox(height: 12),
                      FilledButton(
                        onPressed: () => ref.read(chatListControllerProvider.notifier).load(),
                        child: Text(l10n.chatRetry),
                      ),
                    ],
                  )
                : state.items.isEmpty
                    ? Text(l10n.chatEmpty)
                    : ListView.separated(
                        itemCount: state.items.length,
                        separatorBuilder: (_, __) => const Divider(height: 24),
                        itemBuilder: (context, index) {
                          final item = state.items[index];
                          final counterparty =
                              item.counterparty?.displayName ?? item.counterparty?.id ?? '—';
                          final preview = item.lastMessage?.body ?? l10n.chatNoMessagesYet;
                          final unread = item.unreadCount > 0
                              ? ' · ${l10n.chatUnreadCount(item.unreadCount)}'
                              : '';
                          return ListTile(
                            contentPadding: EdgeInsets.zero,
                            title: Text(item.listingTitle.isEmpty ? l10n.chatTitle : item.listingTitle),
                            subtitle: Text('$counterparty · $preview$unread'),
                            onTap: () => context.goNamed(
                              'chat-thread',
                              pathParameters: <String, String>{'id': item.id},
                            ),
                          );
                        },
                      ),
      ),
    );
  }
}
