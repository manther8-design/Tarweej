import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:tarweej_mobile/features/auth/application/auth_controller.dart';
import 'package:tarweej_mobile/l10n/app_localizations.dart';

class OtpPage extends ConsumerStatefulWidget {
  const OtpPage({super.key});

  @override
  ConsumerState<OtpPage> createState() => _OtpPageState();
}

class _OtpPageState extends ConsumerState<OtpPage> {
  final _phone = TextEditingController(text: '+966');
  final _code = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _codeSent = false;

  @override
  void dispose() {
    _phone.dispose();
    _code.dispose();
    super.dispose();
  }

  Future<void> _request() async {
    final phone = _phone.text.trim();
    if (phone.length < 10) {
      return;
    }
    final ok = await ref.read(authControllerProvider.notifier).requestOtp(phone);
    if (ok && mounted) {
      setState(() => _codeSent = true);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(AppLocalizations.of(context).otpSent)),
      );
    }
  }

  Future<void> _verify() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    final ok = await ref.read(authControllerProvider.notifier).verifyOtp(
          phoneE164: _phone.text.trim(),
          code: _code.text.trim(),
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
      appBar: AppBar(title: Text(l10n.otpTitle)),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            Text(l10n.otpSubtitle, style: Theme.of(context).textTheme.bodyLarge),
            const SizedBox(height: 24),
            Form(
              key: _formKey,
              child: Column(
                children: [
                  TextFormField(
                    controller: _phone,
                    keyboardType: TextInputType.phone,
                    decoration: InputDecoration(labelText: l10n.phoneLabel),
                    validator: (value) {
                      if (value == null || !value.startsWith('+') || value.length < 10) {
                        return l10n.validationPhone;
                      }
                      return null;
                    },
                  ),
                  if (_codeSent) ...[
                    const SizedBox(height: 12),
                    TextFormField(
                      controller: _code,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(labelText: l10n.otpCodeLabel),
                      validator: (value) {
                        if (value == null || value.length < 4) {
                          return l10n.validationOtp;
                        }
                        return null;
                      },
                    ),
                  ],
                ],
              ),
            ),
            if (auth.error != null) ...[
              const SizedBox(height: 12),
              Text(auth.error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
            ],
            const SizedBox(height: 24),
            if (!_codeSent)
              FilledButton(
                onPressed: auth.loading ? null : _request,
                child: auth.loading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Text(l10n.otpRequestAction),
              )
            else
              FilledButton(
                onPressed: auth.loading ? null : _verify,
                child: auth.loading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Text(l10n.otpVerifyAction),
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
