import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:tarweej_mobile/features/payments/application/payments_controller.dart';
import 'package:tarweej_mobile/features/payments/domain/payment_models.dart';
import 'package:tarweej_mobile/l10n/app_localizations.dart';

class PromoteListingPage extends ConsumerStatefulWidget {
  const PromoteListingPage({required this.listingId, super.key});

  final String listingId;

  @override
  ConsumerState<PromoteListingPage> createState() => _PromoteListingPageState();
}

class _PromoteListingPageState extends ConsumerState<PromoteListingPage> {
  PricingPlan? _selected;
  late int _durationHours;

  @override
  void initState() {
    super.initState();
    _durationHours = 24;
    Future<void>.microtask(() => ref.read(paymentsControllerProvider.notifier).loadPlans());
  }

  Future<void> _purchase() async {
    final plan = _selected;
    if (plan == null) {
      return;
    }
    final result = await ref.read(paymentsControllerProvider.notifier).purchase(
          listingId: widget.listingId,
          pricingRuleId: plan.id,
          durationHours: _durationHours,
        );
    if (!mounted || result == null) {
      return;
    }
    context.goNamed(
      'payment-result',
      pathParameters: <String, String>{'paymentId': result.payment.id},
      queryParameters: <String, String>{
        'listingId': widget.listingId,
        'sandbox': result.sandbox ? '1' : '0',
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final state = ref.watch(paymentsControllerProvider);
    final plans = state.plans;

    if (_selected == null && plans.isNotEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted || _selected != null) {
          return;
        }
        setState(() {
          _selected = plans.first;
          _durationHours = plans.first.defaultDurationHours;
        });
      });
    }

    return Scaffold(
      appBar: AppBar(title: Text(l10n.promoteTitle)),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(l10n.promoteSubtitle),
            const SizedBox(height: 16),
            if (state.loading)
              const LinearProgressIndicator()
            else if (state.error != null)
              Text(state.error!, style: TextStyle(color: Theme.of(context).colorScheme.error))
            else if (plans.isEmpty)
              Text(l10n.promoteNoPlans)
            else ...[
              DropdownButtonFormField<PricingPlan>(
                value: _selected,
                decoration: InputDecoration(labelText: l10n.promotePlanLabel),
                items: plans
                    .map(
                      (plan) => DropdownMenuItem<PricingPlan>(
                        value: plan,
                        child: Text(
                          '${plan.placement} · ${plan.pricePerHour} ${plan.currencyCode}/h',
                        ),
                      ),
                    )
                    .toList(growable: false),
                onChanged: (value) {
                  if (value == null) {
                    return;
                  }
                  setState(() {
                    _selected = value;
                    _durationHours = value.defaultDurationHours;
                  });
                },
              ),
              const SizedBox(height: 16),
              Text('${l10n.promoteDurationLabel}: $_durationHours h'),
              Slider(
                value: _durationHours.toDouble(),
                min: (_selected?.minDurationHours ?? 1).toDouble(),
                max: (_selected?.maxDurationHours ?? 168).toDouble(),
                divisions: ((_selected?.maxDurationHours ?? 168) -
                            (_selected?.minDurationHours ?? 1))
                        .clamp(1, 167),
                label: '$_durationHours h',
                onChanged: (value) => setState(() => _durationHours = value.round()),
              ),
              if (_selected != null)
                Text(
                  l10n.promoteTotalLabel(
                    (_selected!.pricePerHour * _durationHours).toStringAsFixed(2),
                    _selected!.currencyCode,
                  ),
                ),
              const SizedBox(height: 24),
              FilledButton(
                onPressed: state.busy || _selected == null ? null : _purchase,
                child: Text(l10n.promoteContinueAction),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
