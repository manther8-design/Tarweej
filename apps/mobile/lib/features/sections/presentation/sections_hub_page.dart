import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:tarweej_mobile/core/theme/tarweej_colors.dart';
import 'package:tarweej_mobile/features/sections/domain/section_vertical.dart';
import 'package:tarweej_mobile/l10n/app_localizations.dart';
import 'package:tarweej_mobile/shared/widgets/marketplace_background.dart';

class SectionsHubPage extends StatelessWidget {
  const SectionsHubPage({super.key});

  String _title(AppLocalizations l10n, SectionVertical vertical) {
    return switch (vertical) {
      SectionVertical.general => l10n.sectionGeneral,
      SectionVertical.services => l10n.sectionServices,
      SectionVertical.cars => l10n.sectionCars,
      SectionVertical.realEstate => l10n.sectionRealEstate,
      SectionVertical.jobs => l10n.sectionJobs,
      SectionVertical.shops => l10n.sectionShops,
      SectionVertical.auctions => l10n.sectionAuctions,
      SectionVertical.electronics => l10n.sectionElectronics,
      SectionVertical.animals => l10n.sectionAnimals,
    };
  }

  String _subtitle(AppLocalizations l10n, SectionVertical vertical) {
    return switch (vertical) {
      SectionVertical.general => l10n.sectionGeneralHint,
      SectionVertical.services => l10n.sectionServicesHint,
      SectionVertical.cars => l10n.sectionCarsHint,
      SectionVertical.realEstate => l10n.sectionRealEstateHint,
      SectionVertical.jobs => l10n.sectionJobsHint,
      SectionVertical.shops => l10n.sectionShopsHint,
      SectionVertical.auctions => l10n.sectionAuctionsHint,
      SectionVertical.electronics => l10n.sectionComingSoonHint,
      SectionVertical.animals => l10n.sectionComingSoonHint,
    };
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final primary = SectionVertical.values
        .where((v) => !v.isPlaceholder)
        .toList(growable: false);
    final future = SectionVertical.values
        .where((v) => v.isPlaceholder)
        .toList(growable: false);

    return MarketplaceBackground(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(title: Text(l10n.sectionsTitle)),
        body: ListView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
          children: [
            Text(
              l10n.sectionsSubtitle,
              style: Theme.of(context).textTheme.bodyLarge,
            ),
            const SizedBox(height: 20),
            ...primary.map(
              (vertical) => _SectionTile(
                icon: vertical.icon,
                title: _title(l10n, vertical),
                subtitle: _subtitle(l10n, vertical),
                onTap: () => context.goNamed(
                  'section-detail',
                  pathParameters: <String, String>{'slug': vertical.slug},
                ),
              ),
            ),
            const SizedBox(height: 12),
            Text(
              l10n.sectionsComingSoonHeading,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            ...future.map(
              (vertical) => _SectionTile(
                icon: vertical.icon,
                title: _title(l10n, vertical),
                subtitle: _subtitle(l10n, vertical),
                muted: true,
                onTap: () => context.goNamed(
                  'section-detail',
                  pathParameters: <String, String>{'slug': vertical.slug},
                ),
              ),
            ),
            const SizedBox(height: 16),
            OutlinedButton.icon(
              onPressed: () => context.goNamed('categories'),
              icon: const Icon(Icons.account_tree_outlined),
              label: Text(l10n.browseCategoriesAction),
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionTile extends StatelessWidget {
  const _SectionTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
    this.muted = false,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  final bool muted;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: muted
            ? Colors.white.withValues(alpha: 0.45)
            : Colors.white.withValues(alpha: 0.82),
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: (muted ? TarweejColors.muted : TarweejColors.teal)
                        .withValues(alpha: 0.14),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Icon(
                    icon,
                    color: muted ? TarweejColors.muted : TarweejColors.tealDeep,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title, style: Theme.of(context).textTheme.titleMedium),
                      const SizedBox(height: 2),
                      Text(subtitle, style: Theme.of(context).textTheme.bodySmall),
                    ],
                  ),
                ),
                Icon(
                  Icons.chevron_right_rounded,
                  color: muted ? TarweejColors.muted : TarweejColors.inkSoft,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
