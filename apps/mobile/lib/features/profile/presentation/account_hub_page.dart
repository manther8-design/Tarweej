import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:tarweej_mobile/core/settings/app_settings.dart';
import 'package:tarweej_mobile/core/theme/tarweej_colors.dart';
import 'package:tarweej_mobile/features/auth/application/auth_controller.dart';
import 'package:tarweej_mobile/l10n/app_localizations.dart';
import 'package:tarweej_mobile/shared/widgets/marketplace_background.dart';

/// Account tab hub: profile summary + marketplace shortcuts + language/theme.
class AccountHubPage extends ConsumerWidget {
  const AccountHubPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final auth = ref.watch(authControllerProvider);
    final settings = ref.watch(appSettingsProvider);
    final user = auth.user;

    return MarketplaceBackground(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(title: Text(l10n.navAccount)),
        body: ListView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
          children: [
            _IdentityCard(
              title: user?.displayName?.trim().isNotEmpty == true
                  ? user!.displayName!
                  : (user?.email ?? l10n.guestLabel),
              subtitle: user == null
                  ? l10n.profileEmpty
                  : '${user.email ?? '—'} · ${user.phoneE164 ?? '—'}',
              actionLabel: user == null ? l10n.loginAction : l10n.profileTitle,
              onAction: () => context.goNamed(user == null ? 'login' : 'profile'),
            ),
            const SizedBox(height: 20),
            Text(l10n.accountHubShortcuts, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            _HubTile(
              icon: Icons.inventory_2_outlined,
              title: l10n.myListingsTitle,
              onTap: () => context.goNamed(
                auth.isAuthenticated ? 'my-listings' : 'login',
              ),
            ),
            _HubTile(
              icon: Icons.favorite_border_rounded,
              title: l10n.favoritesTitle,
              onTap: () => context.goNamed(
                auth.isAuthenticated ? 'favorites' : 'login',
              ),
            ),
            _HubTile(
              icon: Icons.chat_bubble_outline_rounded,
              title: l10n.chatTitle,
              onTap: () => context.goNamed(
                auth.isAuthenticated ? 'chat' : 'login',
              ),
            ),
            _HubTile(
              icon: Icons.notifications_none_rounded,
              title: l10n.notificationsTitle,
              onTap: () => context.goNamed(
                auth.isAuthenticated ? 'notifications' : 'login',
              ),
            ),
            const SizedBox(height: 20),
            Text(l10n.accountHubSettings, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            _HubTile(
              icon: Icons.language_rounded,
              title: l10n.languageLabel,
              trailing: Text(
                settings.localeCode == 'ar' ? 'العربية' : 'English',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              onTap: () => ref.read(appSettingsProvider.notifier).toggleLocale(),
            ),
            _HubTile(
              icon: Icons.brightness_6_outlined,
              title: l10n.themeLabel,
              trailing: Text(
                switch (settings.themeMode) {
                  ThemeMode.light => l10n.themeLight,
                  ThemeMode.dark => l10n.themeDark,
                  ThemeMode.system => l10n.themeSystem,
                },
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              onTap: () async {
                final next = switch (settings.themeMode) {
                  ThemeMode.system => ThemeMode.light,
                  ThemeMode.light => ThemeMode.dark,
                  ThemeMode.dark => ThemeMode.system,
                };
                await ref.read(appSettingsProvider.notifier).setThemeMode(next);
              },
            ),
            _HubTile(
              icon: Icons.public_outlined,
              title: l10n.changeCountryAction,
              onTap: () => context.goNamed('country'),
            ),
            if (auth.isAuthenticated) ...[
              const SizedBox(height: 16),
              OutlinedButton(
                onPressed: () async {
                  await ref.read(authControllerProvider.notifier).logout();
                  if (context.mounted) {
                    context.goNamed('home');
                  }
                },
                child: Text(l10n.logoutAction),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _IdentityCard extends StatelessWidget {
  const _IdentityCard({
    required this.title,
    required this.subtitle,
    required this.actionLabel,
    required this.onAction,
  });

  final String title;
  final String subtitle;
  final String actionLabel;
  final VoidCallback onAction;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF0B2A3A), Color(0xFF14665F)],
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(color: Colors.white),
          ),
          const SizedBox(height: 4),
          Text(
            subtitle,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.white.withValues(alpha: 0.78),
                ),
          ),
          const SizedBox(height: 14),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: TarweejColors.ink,
            ),
            onPressed: onAction,
            child: Text(actionLabel),
          ),
        ],
      ),
    );
  }
}

class _HubTile extends StatelessWidget {
  const _HubTile({
    required this.icon,
    required this.title,
    required this.onTap,
    this.trailing,
  });

  final IconData icon;
  final String title;
  final VoidCallback onTap;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Material(
        color: Colors.white.withValues(alpha: 0.82),
        borderRadius: BorderRadius.circular(14),
        child: ListTile(
          leading: Icon(icon, color: TarweejColors.tealDeep),
          title: Text(title),
          trailing: trailing ?? const Icon(Icons.chevron_right_rounded),
          onTap: onTap,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        ),
      ),
    );
  }
}
