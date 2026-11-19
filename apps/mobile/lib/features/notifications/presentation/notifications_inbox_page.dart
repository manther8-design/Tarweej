import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:tarweej_mobile/features/notifications/application/notifications_controller.dart';
import 'package:tarweej_mobile/l10n/app_localizations.dart';

class NotificationsInboxPage extends ConsumerStatefulWidget {
  const NotificationsInboxPage({super.key});

  @override
  ConsumerState<NotificationsInboxPage> createState() => _NotificationsInboxPageState();
}

class _NotificationsInboxPageState extends ConsumerState<NotificationsInboxPage> {
  @override
  void initState() {
    super.initState();
    Future<void>.microtask(() => ref.read(notificationsControllerProvider.notifier).load());
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final state = ref.watch(notificationsControllerProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.notificationsTitle),
        actions: [
          TextButton(
            onPressed: state.items.isEmpty
                ? null
                : () => ref.read(notificationsControllerProvider.notifier).markAllRead(),
            child: Text(l10n.notificationsMarkAllRead),
          ),
        ],
      ),
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
                        onPressed: () =>
                            ref.read(notificationsControllerProvider.notifier).load(),
                        child: Text(l10n.notificationsRetry),
                      ),
                    ],
                  )
                : state.items.isEmpty
                    ? Text(l10n.notificationsEmpty)
                    : ListView.separated(
                        itemCount: state.items.length,
                        separatorBuilder: (_, __) => const Divider(height: 24),
                        itemBuilder: (context, index) {
                          final item = state.items[index];
                          return ListTile(
                            contentPadding: EdgeInsets.zero,
                            leading: Icon(
                              item.isRead
                                  ? Icons.notifications_none
                                  : Icons.notifications_active,
                            ),
                            title: Text(
                              item.titleHint,
                              style: TextStyle(
                                fontWeight: item.isRead ? FontWeight.w400 : FontWeight.w700,
                              ),
                            ),
                            subtitle: Text(item.bodyHint),
                            trailing: item.isRead
                                ? null
                                : TextButton(
                                    onPressed: () => ref
                                        .read(notificationsControllerProvider.notifier)
                                        .markRead(item.id),
                                    child: Text(l10n.notificationsMarkRead),
                                  ),
                          );
                        },
                      ),
      ),
    );
  }
}
