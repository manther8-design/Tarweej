import 'package:flutter/material.dart';
import 'package:tarweej_mobile/core/theme/tarweej_colors.dart';
import 'package:tarweej_mobile/l10n/app_localizations.dart';

class FeaturedBadge extends StatelessWidget {
  const FeaturedBadge({super.key, this.compact = false});

  final bool compact;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: compact ? 8 : 10,
        vertical: compact ? 3 : 5,
      ),
      decoration: BoxDecoration(
        color: TarweejColors.featuredSoft,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: TarweejColors.featured.withValues(alpha: 0.35)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.bolt_rounded,
            size: compact ? 12 : 14,
            color: TarweejColors.featured,
          ),
          const SizedBox(width: 4),
          Text(
            l10n.searchFeaturedBadge,
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
                  color: TarweejColors.featured,
                  fontWeight: FontWeight.w700,
                ),
          ),
        ],
      ),
    );
  }
}
