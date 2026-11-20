import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:tarweej_mobile/core/config/app_config.dart';
import 'package:tarweej_mobile/core/network/api_client.dart';
import 'package:tarweej_mobile/core/theme/tarweej_colors.dart';
import 'package:tarweej_mobile/features/auth/application/auth_controller.dart';
import 'package:tarweej_mobile/features/chat/application/chat_controller.dart';
import 'package:tarweej_mobile/features/favorites/application/favorites_controller.dart';
import 'package:tarweej_mobile/features/favorites/data/favorites_api.dart';
import 'package:tarweej_mobile/features/listings/application/listings_controller.dart';
import 'package:tarweej_mobile/features/listings/domain/listing_models.dart';
import 'package:tarweej_mobile/features/reports/data/reports_api.dart';
import 'package:tarweej_mobile/features/search/application/search_controller.dart';
import 'package:tarweej_mobile/features/search/domain/search_models.dart';
import 'package:tarweej_mobile/l10n/app_localizations.dart';
import 'package:tarweej_mobile/shared/widgets/async_state_views.dart';
import 'package:tarweej_mobile/shared/widgets/featured_badge.dart';
import 'package:tarweej_mobile/shared/widgets/listing_card.dart';
import 'package:tarweej_mobile/shared/widgets/listing_network_image.dart';
import 'package:tarweej_mobile/shared/widgets/marketplace_background.dart';

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
  int _galleryIndex = 0;
  List<SearchListingHit> _similar = const [];

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
      await _loadSimilar();
    });
  }

  Future<void> _loadSimilar() async {
    final detail = ref.read(listingsControllerProvider).detail;
    if (detail == null) {
      return;
    }
    try {
      final result = await ref.read(searchApiProvider).searchListings(
            SearchQuery(
              categoryId: detail.categoryId,
              countryId: detail.countryId,
              page: 1,
              pageSize: 8,
              sort: 'newest',
            ),
          );
      if (!mounted) {
        return;
      }
      setState(() {
        _similar = result.items
            .where((hit) => hit.id != widget.listingId)
            .take(6)
            .toList(growable: false);
      });
    } catch (_) {
      // Similar rail is best-effort.
    }
  }

  Future<void> _shareListing(ListingDetail detail) async {
    final l10n = AppLocalizations.of(context);
    final base = AppConfig.development.apiBaseUrl.replaceAll('/api/v1', '');
    final link = '$base/listings/${detail.id}';
    await Clipboard.setData(ClipboardData(text: '${detail.title}\n$link'));
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(l10n.listingShareCopied)),
      );
    }
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

    return MarketplaceBackground(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(
          title: Text(detail?.title ?? l10n.listingDetailTitle),
          actions: [
            if (detail != null)
              IconButton(
                tooltip: l10n.listingShareAction,
                onPressed: () => _shareListing(detail),
                icon: const Icon(Icons.ios_share_rounded),
              ),
            if (showEngagement)
              IconButton(
                tooltip: _favorited ? l10n.listingUnfavoriteCta : l10n.listingFavoriteCta,
                onPressed: _favoriteBusy ? null : _toggleFavorite,
                icon: Icon(
                  _favorited ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                  color: _favorited ? TarweejColors.coral : null,
                ),
              ),
          ],
        ),
        body: state.loading && detail == null
            ? const MarketplaceLoadingView()
            : state.error != null && detail == null
                ? MarketplaceErrorView(
                    message: state.error!,
                    retryLabel: l10n.homeFeedRetry,
                    onRetry: () {
                      final notifier = ref.read(listingsControllerProvider.notifier);
                      if (widget.mine) {
                        notifier.loadMineDetail(widget.listingId);
                      } else {
                        notifier.loadPublicDetail(widget.listingId);
                      }
                    },
                  )
                : detail == null
                    ? MarketplaceEmptyView(title: l10n.listingNotFound)
                    : _DetailBody(
                        detail: detail,
                        l10n: l10n,
                        galleryIndex: _galleryIndex,
                        onGalleryChanged: (i) => setState(() => _galleryIndex = i),
                        showEngagement: showEngagement,
                        mine: widget.mine,
                        favorited: _favorited,
                        favoriteBusy: _favoriteBusy,
                        chatBusy: _chatBusy,
                        reportBusy: _reportBusy,
                        actionError: _actionError,
                        similar: _similar,
                        onFavorite: _toggleFavorite,
                        onChat: _contactSeller,
                        onReport: _reportListing,
                        onShare: () => _shareListing(detail),
                        onPromote: () => context.goNamed(
                          'listing-promote',
                          pathParameters: <String, String>{'id': detail.id},
                        ),
                        onOpenListing: (id) => context.goNamed(
                          'listing-detail',
                          pathParameters: <String, String>{'id': id},
                        ),
                      ),
        bottomNavigationBar: showEngagement && detail != null
            ? SafeArea(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
                  child: Row(
                    children: [
                      Expanded(
                        child: FilledButton.tonalIcon(
                          onPressed: _favoriteBusy ? null : _toggleFavorite,
                          icon: Icon(
                            _favorited ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                          ),
                          label: Text(
                            _favorited ? l10n.listingUnfavoriteCta : l10n.listingFavoriteCta,
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        flex: 2,
                        child: FilledButton.icon(
                          onPressed: _chatBusy ? null : _contactSeller,
                          icon: const Icon(Icons.chat_bubble_outline_rounded),
                          label: Text(l10n.listingContactSellerCta),
                        ),
                      ),
                    ],
                  ),
                ),
              )
            : null,
      ),
    );
  }
}

class _DetailBody extends StatelessWidget {
  const _DetailBody({
    required this.detail,
    required this.l10n,
    required this.galleryIndex,
    required this.onGalleryChanged,
    required this.showEngagement,
    required this.mine,
    required this.favorited,
    required this.favoriteBusy,
    required this.chatBusy,
    required this.reportBusy,
    required this.actionError,
    required this.similar,
    required this.onFavorite,
    required this.onChat,
    required this.onReport,
    required this.onShare,
    required this.onPromote,
    required this.onOpenListing,
  });

  final ListingDetail detail;
  final AppLocalizations l10n;
  final int galleryIndex;
  final ValueChanged<int> onGalleryChanged;
  final bool showEngagement;
  final bool mine;
  final bool favorited;
  final bool favoriteBusy;
  final bool chatBusy;
  final bool reportBusy;
  final String? actionError;
  final List<SearchListingHit> similar;
  final VoidCallback onFavorite;
  final VoidCallback onChat;
  final VoidCallback onReport;
  final VoidCallback onShare;
  final VoidCallback onPromote;
  final ValueChanged<String> onOpenListing;

  @override
  Widget build(BuildContext context) {
    final price = detail.priceAmount == null
        ? l10n.searchPriceUnavailable
        : '${detail.priceAmount!.toStringAsFixed(0)} ${detail.currencyCode ?? ''}'.trim();
    final media = detail.media;

    return ListView(
      padding: const EdgeInsets.only(bottom: 24),
      children: [
        AspectRatio(
          aspectRatio: 1.15,
          child: media.isEmpty
              ? const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 16),
                  child: ListingNetworkImage(url: null, height: double.infinity),
                )
              : Stack(
                  children: [
                    PageView.builder(
                      itemCount: media.length,
                      onPageChanged: onGalleryChanged,
                      itemBuilder: (context, index) {
                        return Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: ListingNetworkImage(
                            url: media[index].cdnUrl,
                            borderRadius: BorderRadius.circular(22),
                          ),
                        );
                      },
                    ),
                    if (detail.isFeaturedCached)
                      const PositionedDirectional(
                        top: 16,
                        start: 28,
                        child: FeaturedBadge(),
                      ),
                    if (media.length > 1)
                      Positioned(
                        left: 0,
                        right: 0,
                        bottom: 14,
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: List<Widget>.generate(media.length, (i) {
                            final active = i == galleryIndex;
                            return AnimatedContainer(
                              duration: const Duration(milliseconds: 220),
                              margin: const EdgeInsets.symmetric(horizontal: 3),
                              width: active ? 18 : 7,
                              height: 7,
                              decoration: BoxDecoration(
                                color: active
                                    ? Colors.white
                                    : Colors.white.withValues(alpha: 0.45),
                                borderRadius: BorderRadius.circular(8),
                              ),
                            );
                          }),
                        ),
                      ),
                  ],
                ),
        ),
        if (media.length > 1)
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 0),
            child: Text(
              l10n.listingGalleryHint,
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ),
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                price,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      color: TarweejColors.tealDeep,
                      fontWeight: FontWeight.w800,
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                detail.title,
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 10),
              Wrap(
                spacing: 10,
                runSpacing: 8,
                children: [
                  _MetaChip(
                    icon: Icons.visibility_outlined,
                    label: '${l10n.listingViewsLabel}: ${detail.viewCount}',
                  ),
                  _MetaChip(
                    icon: Icons.info_outline_rounded,
                    label: '${l10n.listingStatusLabel}: ${detail.status}',
                  ),
                ],
              ),
              if (detail.rejectionReason != null) ...[
                const SizedBox(height: 10),
                Text(
                  '${l10n.listingRejectionLabel}: ${detail.rejectionReason}',
                  style: TextStyle(color: Theme.of(context).colorScheme.error),
                ),
              ],
              if (mine && detail.status == 'active') ...[
                const SizedBox(height: 16),
                FilledButton.icon(
                  onPressed: onPromote,
                  icon: const Icon(Icons.campaign_outlined),
                  label: Text(l10n.promoteListingAction),
                ),
              ],
              if (showEngagement && actionError != null) ...[
                const SizedBox(height: 10),
                Text(
                  actionError!,
                  style: TextStyle(color: Theme.of(context).colorScheme.error),
                ),
              ],
              const SizedBox(height: 20),
              Text(
                l10n.listingSellerHeading,
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 10),
              Builder(
                builder: (context) {
                  final sellerName =
                      (detail.owner?.displayName?.trim().isNotEmpty ?? false)
                          ? detail.owner!.displayName!.trim()
                          : l10n.listingSellerAnonymous;
                  return Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.85),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: TarweejColors.line),
                    ),
                    child: Row(
                      children: [
                        CircleAvatar(
                          backgroundColor:
                              TarweejColors.teal.withValues(alpha: 0.16),
                          foregroundColor: TarweejColors.tealDeep,
                          child: Text(sellerName[0].toUpperCase()),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            sellerName,
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                        ),
                        if (showEngagement)
                          IconButton(
                            tooltip: l10n.listingContactSellerCta,
                            onPressed: chatBusy ? null : onChat,
                            icon: const Icon(Icons.chat_bubble_outline_rounded),
                          ),
                      ],
                    ),
                  );
                },
              ),
              const SizedBox(height: 20),
              Text(
                detail.description,
                style: Theme.of(context).textTheme.bodyLarge,
              ),
              const SizedBox(height: 24),
              Text(
                l10n.listingAttributesHeading,
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 10),
              if (detail.attributes.isEmpty)
                Text(l10n.listingAttributesEmpty)
              else
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: detail.attributes.map((a) {
                    final value = a.valueText ??
                        a.valueNumber?.toString() ??
                        a.valueBool?.toString() ??
                        '—';
                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.85),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: TarweejColors.line),
                      ),
                      child: Text(
                        '${a.code}: $value',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: TarweejColors.charcoal,
                              fontWeight: FontWeight.w600,
                            ),
                      ),
                    );
                  }).toList(growable: false),
                ),
              if (showEngagement) ...[
                const SizedBox(height: 24),
                Row(
                  children: [
                    TextButton.icon(
                      onPressed: onShare,
                      icon: const Icon(Icons.ios_share_rounded),
                      label: Text(l10n.listingShareAction),
                    ),
                    TextButton.icon(
                      onPressed: reportBusy ? null : onReport,
                      icon: const Icon(Icons.flag_outlined),
                      label: Text(l10n.reportListingAction),
                    ),
                  ],
                ),
              ],
              const SizedBox(height: 24),
              Text(
                l10n.listingSimilarHeading,
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 10),
              if (similar.isEmpty)
                Text(l10n.listingSimilarEmpty)
              else
                SizedBox(
                  height: 248,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: similar.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 12),
                    itemBuilder: (context, index) {
                      final hit = similar[index];
                      return SizedBox(
                        width: 176,
                        child: ListingCard(
                          data: ListingCardData(
                            id: hit.id,
                            title: hit.title,
                            priceAmount: hit.priceAmount,
                            currencyCode: hit.currencyCode,
                            coverImageUrl: hit.coverImageUrl,
                            isFeatured: hit.isFeaturedCached,
                          ),
                          onTap: () => onOpenListing(hit.id),
                        ),
                      );
                    },
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }
}

class _MetaChip extends StatelessWidget {
  const _MetaChip({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.8),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: TarweejColors.line),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: TarweejColors.muted),
          const SizedBox(width: 6),
          Text(label, style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    );
  }
}
