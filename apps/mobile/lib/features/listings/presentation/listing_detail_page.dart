import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:tarweej_mobile/features/listings/application/listings_controller.dart';
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
  @override
  void initState() {
    super.initState();
    Future<void>.microtask(() {
      final notifier = ref.read(listingsControllerProvider.notifier);
      if (widget.mine) {
        return notifier.loadMineDetail(widget.listingId);
      }
      return notifier.loadPublicDetail(widget.listingId);
    });
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final state = ref.watch(listingsControllerProvider);
    final detail = state.detail;

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
