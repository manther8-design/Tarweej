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
    // Map NavigationBar index → shell branch (skip create slot).
    final branchIndex = index > 2 ? index - 1 : index;
    navigationShell.goBranch(
      branchIndex,
      initialLocation: branchIndex == navigationShell.currentIndex,
    );
  }

  int get _selectedIndex {
    final branch = navigationShell.currentIndex;
    // branches: 0 home, 1 sections, 2 chat, 3 account → nav slots 0,1,3,4
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
        backgroundColor: scheme.surface.withValues(alpha: 0.94),
        indicatorColor: TarweejColors.teal.withValues(alpha: 0.18),
        destinations: [
          NavigationDestination(
            icon: const Icon(Icons.home_outlined),
            selectedIcon: const Icon(Icons.home_rounded),
            label: l10n.navHome,
          ),
          NavigationDestination(
            icon: const Icon(Icons.grid_view_outlined),
            selectedIcon: const Icon(Icons.grid_view_rounded),
            label: l10n.navSections,
          ),
          NavigationDestination(
            icon: const Icon(Icons.add_circle_outline_rounded),
            selectedIcon: const Icon(Icons.add_circle_rounded),
            label: l10n.navAdd,
          ),
          NavigationDestination(
            icon: const Icon(Icons.chat_bubble_outline_rounded),
            selectedIcon: const Icon(Icons.chat_bubble_rounded),
            label: l10n.navMessages,
          ),
          NavigationDestination(
            icon: const Icon(Icons.person_outline_rounded),
            selectedIcon: const Icon(Icons.person_rounded),
            label: l10n.navAccount,
          ),
        ],
      ),
    );
  }
}
