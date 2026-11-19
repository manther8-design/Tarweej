import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:tarweej_mobile/features/auth/application/auth_controller.dart';
import 'package:tarweej_mobile/features/reference/application/reference_controller.dart';
import 'package:tarweej_mobile/l10n/app_localizations.dart';

class HomePage extends ConsumerWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final auth = ref.watch(authControllerProvider);
    final reference = ref.watch(referenceControllerProvider);
    final name = auth.user?.displayName ?? auth.user?.email ?? l10n.guestLabel;
    final countryLabel = reference.selectedCountryName ??
        reference.selectedCountryIso2 ??
        l10n.countrySelectTitle;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.appTitle),
        actions: [
          IconButton(
            tooltip: l10n.countrySelectTitle,
            onPressed: () => context.goNamed('country'),
            icon: const Icon(Icons.public),
          ),
          IconButton(
            tooltip: l10n.profileTitle,
            onPressed: () => context.goNamed('profile'),
            icon: const Icon(Icons.person_outline),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              l10n.homeHeadline,
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 12),
            Text(l10n.homeBody),
            const SizedBox(height: 16),
            Text('${l10n.signedInAs}: $name'),
            const SizedBox(height: 8),
            Text('${l10n.selectedCountryLabel}: $countryLabel'),
            const SizedBox(height: 24),
            FilledButton(
              onPressed: () => context.goNamed('profile'),
              child: Text(l10n.openProfile),
            ),
            const SizedBox(height: 12),
            OutlinedButton(
              onPressed: () => context.goNamed('country'),
              child: Text(l10n.changeCountryAction),
            ),
          ],
        ),
      ),
    );
  }
}
