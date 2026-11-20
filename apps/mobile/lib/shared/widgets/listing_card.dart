import 'package:flutter/material.dart';
import 'package:tarweej_mobile/core/theme/tarweej_colors.dart';
import 'package:tarweej_mobile/l10n/app_localizations.dart';
import 'package:tarweej_mobile/shared/widgets/featured_badge.dart';
import 'package:tarweej_mobile/shared/widgets/listing_network_image.dart';

class ListingCardData {
  const ListingCardData({
    required this.id,
    required this.title,
    this.priceAmount,
    this.currencyCode,
    this.coverImageUrl,
    this.locationLabel,
    this.isFeatured = false,
    this.subtitle,
  });

  final String id;
  final String title;
  final double? priceAmount;
  final String? currencyCode;
  final String? coverImageUrl;
  final String? locationLabel;
  final bool isFeatured;
  final String? subtitle;
}

class ListingCard extends StatelessWidget {
  const ListingCard({
    required this.data,
    required this.onTap,
    super.key,
    this.trailing,
    this.dense = false,
  });

  final ListingCardData data;
  final VoidCallback onTap;
  final Widget? trailing;
  final bool dense;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final price = data.priceAmount == null
        ? l10n.searchPriceUnavailable
        : '${_formatPrice(data.priceAmount!)} ${data.currencyCode ?? ''}'.trim();

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Ink(
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.88),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: TarweejColors.line.withValues(alpha: 0.7)),
          ),
          child: dense
              ? _DenseBody(data: data, price: price, trailing: trailing)
              : _GridBody(data: data, price: price),
        ),
      ),
    );
  }

  static String _formatPrice(double value) {
    if (value == value.roundToDouble()) {
      return value.toStringAsFixed(0);
    }
    return value.toStringAsFixed(2);
  }
}

class _GridBody extends StatelessWidget {
  const _GridBody({required this.data, required this.price});

  final ListingCardData data;
  final String price;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AspectRatio(
          aspectRatio: 1.15,
          child: Stack(
            fit: StackFit.expand,
            children: [
              ListingNetworkImage(
                url: data.coverImageUrl,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(18)),
              ),
              if (data.isFeatured)
                const PositionedDirectional(
                  top: 10,
                  start: 10,
                  child: FeaturedBadge(compact: true),
                ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(12, 10, 12, 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                price,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: TarweejColors.orange600,
                      fontWeight: FontWeight.w800,
                    ),
              ),
              const SizedBox(height: 4),
              Text(
                data.title,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.w600,
                      height: 1.25,
                    ),
              ),
              if (data.locationLabel != null && data.locationLabel!.isNotEmpty) ...[
                const SizedBox(height: 6),
                Row(
                  children: [
                    const Icon(Icons.place_outlined, size: 14, color: TarweejColors.muted),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        data.locationLabel!,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

class _DenseBody extends StatelessWidget {
  const _DenseBody({
    required this.data,
    required this.price,
    this.trailing,
  });

  final ListingCardData data;
  final String price;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(10),
      child: Row(
        children: [
          ListingNetworkImage(
            url: data.coverImageUrl,
            width: 92,
            height: 92,
            borderRadius: BorderRadius.circular(14),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (data.isFeatured) ...[
                  const FeaturedBadge(compact: true),
                  const SizedBox(height: 6),
                ],
                Text(
                  price,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: TarweejColors.orange600,
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  data.title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                ),
                if (data.locationLabel != null || data.subtitle != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    data.locationLabel ?? data.subtitle!,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ],
            ),
          ),
          if (trailing != null) trailing!,
        ],
      ),
    );
  }
}
