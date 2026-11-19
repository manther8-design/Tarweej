import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:tarweej_mobile/features/auth/application/auth_controller.dart';
import 'package:tarweej_mobile/features/chat/application/chat_controller.dart';
import 'package:tarweej_mobile/core/network/api_client.dart';
import 'package:tarweej_mobile/features/favorites/application/favorites_controller.dart';
import 'package:tarweej_mobile/features/favorites/data/favorites_api.dart';
import 'package:tarweej_mobile/features/listings/application/listings_controller.dart';
import 'package:tarweej_mobile/features/reports/data/reports_api.dart';
import 'package:tarweej_mobile/l10n/app_localizations.dart';

class ListingDetailPage extends ConsumerStatefulWidget {
  const ListingDetailPage({
    required this.listingId,
    this.mine = false,
    super.key,
  });

  final String listingId;
  final bool mine;

  @override
  ConsumerState<ListingDetailPage> createState() => _ListingDetailPageState();
}

class _ListingDetailPageState extends ConsumerState<ListingDetailPage> {
  bool _favorited = false;
  bool _favoriteBusy = false;
  bool _chatBusy = false;
  bool _reportBusy = false;
  String? _actionError;

  @override
  void initState() {
    super.initState();
    Future<void>.microtask(() async {
      final notifier = ref.read(listingsControllerProvider.notifier);
      if (widget.mine) {
        await notifier.loadMineDetail(widget.listingId);
      } else {
        await notifier.loadPublicDetail(widget.listingId);
      }
      await _refreshFavoriteStatus();
    });
  }

  Future<void> _refreshFavoriteStatus() async {
    if (widget.mine) {
      return;
    }
    final token = ref.read(authControllerProvider).tokens?.accessToken;
    if (token == null) {
      return;
    }
    try {
      final favorited = await ref.read(favoritesApiProvider).isFavorited(
            accessToken: token,
            listingId: widget.listingId,
          );
      if (mounted) {
        setState(() => _favorited = favorited);
      }
    } on FavoritesApiException {
      // Ignore status probe failures on detail.
    }
  }

  Future<void> _toggleFavorite() async {
    final token = ref.read(authControllerProvider).tokens?.accessToken;
    if (token == null) {
      if (mounted) {
        context.goNamed('login');
      }
      return;
    }
    setState(() {
      _favoriteBusy = true;
      _actionError = null;
    });
    try {
      final api = ref.read(favoritesApiProvider);
      if (_favorited) {
        await api.remove(accessToken: token, listingId: widget.listingId);
        setState(() => _favorited = false);
      } else {
        await api.add(accessToken: token, listingId: widget.listingId);
        setState(() => _favorited = true);
      }
      await ref.read(favoritesControllerProvider.notifier).load();
    } on FavoritesApiException catch (error) {
      setState(() => _actionError = error.message);
    } finally {
      if (mounted) {
        setState(() => _favoriteBusy = false);
      }
    }
  }

  Future<void> _contactSeller() async {
    final token = ref.read(authControllerProvider).tokens?.accessToken;
    if (token == null) {
      if (mounted) {
        context.goNamed('login');
      }
      return;
    }
    setState(() {
      _chatBusy = true;
      _actionError = null;
    });
    final conversationId =
        await ref.read(chatListControllerProvider.notifier).openForListing(widget.listingId);
    if (!mounted) {
      return;
    }
    setState(() => _chatBusy = false);
    if (conversationId == null) {
      final error = ref.read(chatListControllerProvider).error;
      setState(() => _actionError = error ?? 'Could not open chat');
      return;
    }
    context.goNamed(
      'chat-thread',
      pathParameters: <String, String>{'id': conversationId},
    );
  }

  Future<void> _reportListing() async {
    final token = ref.read(authControllerProvider).tokens?.accessToken;
    if (token == null) {
      if (mounted) {
        context.goNamed('login');
      }
      return;
    }
    final l10n = AppLocalizations.of(context);
    final reasons = <MapEntry<String, String>>[
      MapEntry('spam', l10n.reportReasonSpam),
      MapEntry('fraud', l10n.reportReasonFraud),
      MapEntry('inappropriate', l10n.reportReasonInappropriate),
      MapEntry('counterfeit', l10n.reportReasonCounterfeit),
      MapEntry('harassment', l10n.reportReasonHarassment),
      MapEntry('other', l10n.reportReasonOther),
    ];
    String selected = reasons.first.key;
    final notesController = TextEditingController();

    final submitted = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: Text(l10n.reportListingTitle),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  DropdownButtonFormField<String>(
                    value: selected,
                    items: reasons
                        .map(
                          (entry) => DropdownMenuItem<String>(
                            value: entry.key,
                            child: Text(entry.value),
                          ),
                        )
                        .toList(growable: false),
                    onChanged: (value) {
                      if (value == null) {
                        return;
                      }
                      setDialogState(() => selected = value);
                    },
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: notesController,
                    maxLines: 3,
                    decoration: InputDecoration(hintText: l10n.reportNotesHint),
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(dialogContext).pop(false),
                  child: Text(MaterialLocalizations.of(context).cancelButtonLabel),
                ),
                FilledButton(
                  onPressed: () => Navigator.of(dialogContext).pop(true),
                  child: Text(l10n.reportSubmitAction),
                ),
              ],
            );
          },
        );
      },
    );

    if (submitted != true || !mounted) {
      notesController.dispose();
      return;
    }

    setState(() {
      _reportBusy = true;
      _actionError = null;
    });
    try {
      final api = ReportsApi(ref.read(dioProvider));
      await api.reportListing(
        accessToken: token,
        listingId: widget.listingId,
        reasonCode: selected,
        notes: notesController.text,
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(l10n.reportSuccessMessage)),
        );
      }
    } on ReportsApiException catch (error) {
      if (mounted) {
        setState(() => _actionError = error.message);
      }
    } finally {
      notesController.dispose();
      if (mounted) {
        setState(() => _reportBusy = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final state = ref.watch(listingsControllerProvider);
    final detail = state.detail;
    final showEngagement = !widget.mine;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.listingDetailTitle)),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: state.loading && detail == null
            ? const Center(child: CircularProgressIndicator())
            : state.error != null && detail == null
                ? Text(state.error!)
                : detail == null
                    ? Text(l10n.listingNotFound)
                    : ListView(
                        children: [
                          Text(
                            detail.title,
                            style: Theme.of(context).textTheme.headlineSmall,
                          ),
                          const SizedBox(height: 8),
                          Text(
                            detail.priceAmount == null
                                ? '—'
                                : '${detail.priceAmount!.toStringAsFixed(0)} ${detail.currencyCode ?? ''}',
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          const SizedBox(height: 8),
                          Text('${l10n.listingStatusLabel}: ${detail.status}'),
                          Text('${l10n.listingViewsLabel}: ${detail.viewCount}'),
                          if (detail.rejectionReason != null) ...[
                            const SizedBox(height: 8),
                            Text('${l10n.listingRejectionLabel}: ${detail.rejectionReason}'),
                          ],
                          if (widget.mine && detail.status == 'active') ...[
                            const SizedBox(height: 16),
                            FilledButton.icon(
                              onPressed: () => context.goNamed(
                                'listing-promote',
                                pathParameters: <String, String>{'id': detail.id},
                              ),
                              icon: const Icon(Icons.campaign_outlined),
                              label: Text(l10n.promoteListingAction),
                            ),
                          ],
                          if (showEngagement) ...[
                            const SizedBox(height: 16),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: [
                                FilledButton.tonalIcon(
                                  onPressed: _favoriteBusy ? null : _toggleFavorite,
                                  icon: Icon(_favorited ? Icons.favorite : Icons.favorite_border),
                                  label: Text(
                                    _favorited
                                        ? l10n.favoritesRemoveAction
                                        : l10n.favoritesAddAction,
                                  ),
                                ),
                                FilledButton.icon(
                                  onPressed: _chatBusy ? null : _contactSeller,
                                  icon: const Icon(Icons.chat_bubble_outline),
                                  label: Text(l10n.chatContactSeller),
                                ),
                                OutlinedButton.icon(
                                  onPressed: _reportBusy ? null : _reportListing,
                                  icon: const Icon(Icons.flag_outlined),
                                  label: Text(l10n.reportListingAction),
                                ),
                              ],
                            ),
                            if (_actionError != null) ...[
                              const SizedBox(height: 8),
                              Text(
                                _actionError!,
                                style: TextStyle(color: Theme.of(context).colorScheme.error),
                              ),
                            ],
                          ],
                          const SizedBox(height: 16),
                          Text(detail.description),
                          const SizedBox(height: 24),
                          Text(
                            l10n.listingMediaHeading,
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          const SizedBox(height: 8),
                          if (detail.media.isEmpty)
                            Text(l10n.listingMediaEmpty)
                          else
                            ...detail.media.map(
                              (m) => Padding(
                                padding: const EdgeInsets.only(bottom: 8),
                                child: Text(m.cdnUrl, style: Theme.of(context).textTheme.bodySmall),
                              ),
                            ),
                          const SizedBox(height: 16),
                          Text(
                            l10n.listingAttributesHeading,
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          const SizedBox(height: 8),
                          if (detail.attributes.isEmpty)
                            Text(l10n.listingAttributesEmpty)
                          else
                            ...detail.attributes.map((a) {
                              final value = a.valueText ??
                                  a.valueNumber?.toString() ??
                                  a.valueBool?.toString() ??
                                  '—';
                              return Text('${a.code}: $value');
                            }),
                        ],
                      ),
      ),
    );
  }
}
