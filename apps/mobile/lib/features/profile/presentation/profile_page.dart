import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:tarweej_mobile/features/auth/application/auth_controller.dart';
import 'package:tarweej_mobile/l10n/app_localizations.dart';

class ProfilePage extends ConsumerStatefulWidget {
  const ProfilePage({super.key});

  @override
  ConsumerState<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends ConsumerState<ProfilePage> {
  late final TextEditingController _displayName;

  @override
  void initState() {
    super.initState();
    final user = ref.read(authControllerProvider).user;
    _displayName = TextEditingController(text: user?.displayName ?? '');
  }

  @override
  void dispose() {
    _displayName.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final ok = await ref.read(authControllerProvider.notifier).updateProfile(
          displayName: _displayName.text.trim(),
        );
    if (ok && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(AppLocalizations.of(context).profileSaved)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final auth = ref.watch(authControllerProvider);
    final user = auth.user;

    if (!auth.bootstrapped || auth.loading && user == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    if (user == null) {
      return Scaffold(
        appBar: AppBar(title: Text(l10n.profileTitle)),
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(l10n.profileEmpty),
              const SizedBox(height: 12),
              FilledButton(
                onPressed: () => context.goNamed('login'),
                child: Text(l10n.goToLogin),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(title: Text(l10n.profileTitle)),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Text(l10n.profileSubtitle, style: Theme.of(context).textTheme.bodyLarge),
          const SizedBox(height: 16),
          Text('${l10n.emailLabel}: ${user.email ?? '—'}'),
          Text('${l10n.phoneLabel}: ${user.phoneE164 ?? '—'}'),
          const SizedBox(height: 16),
          TextField(
            controller: _displayName,
            decoration: InputDecoration(labelText: l10n.displayNameLabel),
          ),
          if (auth.error != null) ...[
            const SizedBox(height: 12),
            Text(auth.error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
          ],
          const SizedBox(height: 24),
          FilledButton(
            onPressed: auth.loading ? null : _save,
            child: auth.loading
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : Text(l10n.profileSaveAction),
          ),
          const SizedBox(height: 8),
          OutlinedButton(
            onPressed: () async {
              await ref.read(authControllerProvider.notifier).logout();
              if (context.mounted) {
                context.goNamed('login');
              }
            },
            child: Text(l10n.logoutAction),
          ),
        ],
      ),
    );
  }
}
