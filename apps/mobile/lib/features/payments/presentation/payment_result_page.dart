import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:tarweej_mobile/features/payments/application/payments_controller.dart';
import 'package:tarweej_mobile/l10n/app_localizations.dart';

class PaymentResultPage extends ConsumerStatefulWidget {
  const PaymentResultPage({
    required this.paymentId,
    required this.listingId,
    this.sandbox = true,
    super.key,
  });

  final String paymentId;
  final String listingId;
  final bool sandbox;

  @override
  ConsumerState<PaymentResultPage> createState() => _PaymentResultPageState();
}

class _PaymentResultPageState extends ConsumerState<PaymentResultPage> {
  Future<void> _simulatePay() async {
    final result = await ref.read(paymentsControllerProvider.notifier).completeMock(
          paymentId: widget.paymentId,
          outcome: 'paid',
        );
    if (!mounted || result == null) {
      return;
    }
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final state = ref.watch(paymentsControllerProvider);
    final completion = state.completion;
    final purchase = state.purchase;
    final payment = completion?.payment ?? purchase?.payment;
    final promotion = completion?.promotion ?? purchase?.promotion;
    final paid = payment?.status == 'paid';

    return Scaffold(
      appBar: AppBar(title: Text(l10n.paymentResultTitle)),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              paid ? l10n.paymentResultSuccess : l10n.paymentResultPending,
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 12),
            if (payment != null) ...[
              Text('${l10n.paymentStatusLabel}: ${payment.status}'),
              Text('${l10n.paymentAmountLabel}: ${payment.amount} ${payment.currencyCode}'),
              Text('${l10n.paymentProviderLabel}: ${payment.providerCode}'),
            ],
            if (promotion != null) ...[
              const SizedBox(height: 8),
              Text('${l10n.promotionStatusLabel}: ${promotion.status}'),
              if (promotion.endsAt != null)
                Text('${l10n.promotionEndsLabel}: ${promotion.endsAt}'),
            ],
            if (state.error != null) ...[
              const SizedBox(height: 12),
              Text(state.error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
            ],
            const Spacer(),
            if (widget.sandbox && !paid)
              FilledButton(
                onPressed: state.busy ? null : _simulatePay,
                child: Text(l10n.paymentSimulatePaidAction),
              ),
            const SizedBox(height: 8),
            OutlinedButton(
              onPressed: () => context.goNamed(
                'listing-detail',
                pathParameters: <String, String>{'id': widget.listingId},
                queryParameters: <String, String>{'mine': '1'},
              ),
              child: Text(l10n.paymentBackToListingAction),
            ),
          ],
        ),
      ),
    );
  }
}
