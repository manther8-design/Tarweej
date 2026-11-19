import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:tarweej_mobile/features/auth/application/auth_controller.dart';
import 'package:tarweej_mobile/features/reference/application/reference_controller.dart';
import 'package:tarweej_mobile/l10n/app_localizations.dart';

class SplashPage extends ConsumerStatefulWidget {
  const SplashPage({super.key});

  @override
  ConsumerState<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends ConsumerState<SplashPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _routeWhenReady());
  }

  Future<void> _routeWhenReady() async {
    // Give auth/reference bootstrap a brief moment; GoRouter redirect also reacts.
    await Future<void>.delayed(const Duration(milliseconds: 600));
    if (!mounted) {
      return;
    }
    var auth = ref.read(authControllerProvider);
    var reference = ref.read(referenceControllerProvider);
    if (!auth.bootstrapped || !reference.bootstrapped) {
      await Future<void>.delayed(const Duration(milliseconds: 400));
    }
    if (!mounted) {
      return;
    }
    auth = ref.read(authControllerProvider);
    reference = ref.read(referenceControllerProvider);
    if (!reference.hasCountry) {
      context.goNamed('country');
      return;
    }
    context.goNamed(auth.isAuthenticated ? 'home' : 'login');
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              l10n.appTitle,
              style: Theme.of(context).textTheme.displaySmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
            const SizedBox(height: 12),
            Text(l10n.splashTagline),
            const SizedBox(height: 24),
            const CircularProgressIndicator(),
          ],
        ),
      ),
    );
  }
}
