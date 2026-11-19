import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:tarweej_mobile/features/auth/application/auth_controller.dart';
import 'package:tarweej_mobile/features/chat/application/chat_controller.dart';
import 'package:tarweej_mobile/l10n/app_localizations.dart';

class ChatThreadPage extends ConsumerStatefulWidget {
  const ChatThreadPage({required this.conversationId, super.key});

  final String conversationId;

  @override
  ConsumerState<ChatThreadPage> createState() => _ChatThreadPageState();
}

class _ChatThreadPageState extends ConsumerState<ChatThreadPage> {
  final _composer = TextEditingController();

  @override
  void initState() {
    super.initState();
    Future<void>.microtask(
      () => ref.read(chatThreadControllerProvider.notifier).load(widget.conversationId),
    );
  }

  @override
  void dispose() {
    _composer.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final state = ref.watch(chatThreadControllerProvider);
    final myUserId = ref.watch(authControllerProvider).user?.id;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.chatThreadTitle)),
      body: Column(
        children: [
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: state.loading && state.messages.isEmpty
                  ? const Center(child: CircularProgressIndicator())
                  : state.error != null && state.messages.isEmpty
                      ? Text(state.error!)
                      : state.messages.isEmpty
                          ? Text(l10n.chatNoMessagesYet)
                          : ListView.builder(
                              itemCount: state.messages.length,
                              itemBuilder: (context, index) {
                                final message = state.messages[index];
                                final mine = message.senderId == myUserId;
                                return Align(
                                  alignment:
                                      mine ? Alignment.centerRight : Alignment.centerLeft,
                                  child: Container(
                                    margin: const EdgeInsets.only(bottom: 8),
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 12,
                                      vertical: 8,
                                    ),
                                    decoration: BoxDecoration(
                                      color: mine
                                          ? Theme.of(context).colorScheme.primaryContainer
                                          : Theme.of(context).colorScheme.surfaceContainerHighest,
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Text(message.body),
                                  ),
                                );
                              },
                            ),
            ),
          ),
          if (state.error != null && state.messages.isNotEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Text(state.error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
            ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _composer,
                      decoration: InputDecoration(
                        hintText: l10n.chatMessageHint,
                        border: const OutlineInputBorder(),
                      ),
                      minLines: 1,
                      maxLines: 4,
                      enabled: !state.sending,
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton.filled(
                    onPressed: state.sending
                        ? null
                        : () async {
                            final ok = await ref
                                .read(chatThreadControllerProvider.notifier)
                                .send(widget.conversationId, _composer.text);
                            if (ok) {
                              _composer.clear();
                            }
                          },
                    icon: state.sending
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.send),
                    tooltip: l10n.chatSendAction,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
