import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:tarweej_mobile/core/theme/tarweej_colors.dart';
import 'package:tarweej_mobile/l10n/app_localizations.dart';

/// Persistent marketplace chrome: home / sections / add / messages / account.
class MainShell extends StatelessWidget {
  const MainShell({required this.navigationShell, super.key});

  final StatefulNavigationShell navigationShell;

  void _onTap(BuildContext context, int index) {
    if (index == 2) {
      context.goNamed('listing-create');
      return;
    }
    final branchIndex = index > 2 ? index - 1 : index;
    navigationShell.goBranch(
      branchIndex,
      initialLocation: branchIndex == navigationShell.currentIndex,
    );
  }

  int get _selectedIndex {
    final branch = navigationShell.currentIndex;
    return branch >= 2 ? branch + 1 : branch;
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final scheme = Theme.of(context).colorScheme;

    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: (index) => _onTap(context, index),
        backgroundColor: scheme.surface.withValues(alpha: 0.96),
        indicatorColor: TarweejColors.orange500.withValues(alpha: 0.14),
        destinations: [
          NavigationDestination(
            icon: const Icon(Icons.home_outlined),
            selectedIcon: const Icon(Icons.home_rounded, color: TarweejColors.orange500),
            label: l10n.navHome,
          ),
          NavigationDestination(
            icon: const Icon(Icons.grid_view_outlined),
            selectedIcon: const Icon(Icons.grid_view_rounded, color: TarweejColors.orange500),
            label: l10n.navSections,
          ),
          NavigationDestination(
            icon: const Icon(Icons.add_circle_rounded, color: TarweejColors.orange500, size: 30),
            selectedIcon:
                const Icon(Icons.add_circle_rounded, color: TarweejColors.orange500, size: 30),
            label: l10n.navAdd,
          ),
          NavigationDestination(
            icon: const Icon(Icons.chat_bubble_outline_rounded),
            selectedIcon:
                const Icon(Icons.chat_bubble_rounded, color: TarweejColors.orange500),
            label: l10n.navMessages,
          ),
          NavigationDestination(
            icon: const Icon(Icons.person_outline_rounded),
            selectedIcon: const Icon(Icons.person_rounded, color: TarweejColors.orange500),
            label: l10n.navAccount,
          ),
        ],
      ),
    );
  }
}
