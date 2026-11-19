import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:tarweej_mobile/features/auth/application/auth_controller.dart';
import 'package:tarweej_mobile/l10n/app_localizations.dart';

class RegisterPage extends ConsumerStatefulWidget {
  const RegisterPage({super.key});

  @override
  ConsumerState<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends ConsumerState<RegisterPage> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _displayName = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    _displayName.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    final ok = await ref.read(authControllerProvider.notifier).register(
          email: _email.text.trim(),
          password: _password.text,
          displayName: _displayName.text.trim(),
        );
    if (ok && mounted) {
      context.goNamed('home');
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final auth = ref.watch(authControllerProvider);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.registerTitle)),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            Text(l10n.registerSubtitle, style: Theme.of(context).textTheme.bodyLarge),
            const SizedBox(height: 24),
            Form(
              key: _formKey,
              child: Column(
                children: [
                  TextFormField(
                    controller: _displayName,
                    decoration: InputDecoration(labelText: l10n.displayNameLabel),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _email,
                    keyboardType: TextInputType.emailAddress,
                    decoration: InputDecoration(labelText: l10n.emailLabel),
                    validator: (value) {
                      if (value == null || !value.contains('@')) {
                        return l10n.validationEmail;
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _password,
                    obscureText: true,
                    decoration: InputDecoration(labelText: l10n.passwordLabel),
                    validator: (value) {
                      if (value == null || value.length < 8) {
                        return l10n.validationPassword;
                      }
                      return null;
                    },
                  ),
                ],
              ),
            ),
            if (auth.error != null) ...[
              const SizedBox(height: 12),
              Text(auth.error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
            ],
            const SizedBox(height: 24),
            FilledButton(
              onPressed: auth.loading ? null : _submit,
              child: auth.loading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : Text(l10n.registerAction),
            ),
            TextButton(
              onPressed: () => context.goNamed('login'),
              child: Text(l10n.goToLogin),
            ),
          ],
        ),
      ),
    );
  }
}
