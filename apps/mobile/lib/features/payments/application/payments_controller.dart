import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:tarweej_mobile/core/network/api_client.dart';
import 'package:tarweej_mobile/features/auth/application/auth_controller.dart';
import 'package:tarweej_mobile/features/payments/data/payments_api.dart';
import 'package:tarweej_mobile/features/payments/domain/payment_models.dart';
import 'package:tarweej_mobile/features/reference/application/reference_controller.dart';

final paymentsApiProvider = Provider<PaymentsApi>((ref) {
  return PaymentsApi(ref.watch(dioProvider));
});

@immutable
class PaymentsUiState {
  const PaymentsUiState({
    this.loading = false,
    this.busy = false,
    this.plans = const <PricingPlan>[],
    this.purchase,
    this.completion,
    this.error,
  });

  final bool loading;
  final bool busy;
  final List<PricingPlan> plans;
  final PurchaseResult? purchase;
  final PaymentCompletionResult? completion;
  final String? error;

  PaymentsUiState copyWith({
    bool? loading,
    bool? busy,
    List<PricingPlan>? plans,
    PurchaseResult? purchase,
    PaymentCompletionResult? completion,
    String? error,
    bool clearError = false,
    bool clearPurchase = false,
    bool clearCompletion = false,
  }) {
    return PaymentsUiState(
      loading: loading ?? this.loading,
      busy: busy ?? this.busy,
      plans: plans ?? this.plans,
      purchase: clearPurchase ? null : (purchase ?? this.purchase),
      completion: clearCompletion ? null : (completion ?? this.completion),
      error: clearError ? null : (error ?? this.error),
    );
  }
}

class PaymentsController extends Notifier<PaymentsUiState> {
  @override
  PaymentsUiState build() => const PaymentsUiState();

  String? get _token => ref.read(authControllerProvider).tokens?.accessToken;

  Future<void> loadPlans() async {
    state = state.copyWith(loading: true, clearError: true);
    try {
      final countryId = ref.read(referenceControllerProvider).selectedCountryId;
      final plans = await ref.read(paymentsApiProvider).listPlans(countryId: countryId);
      state = state.copyWith(loading: false, plans: plans);
    } on PaymentsApiException catch (error) {
      state = state.copyWith(loading: false, error: error.message);
    }
  }

  Future<PurchaseResult?> purchase({
    required String listingId,
    required String pricingRuleId,
    required int durationHours,
  }) async {
    final token = _token;
    if (token == null) {
      state = state.copyWith(error: 'Not authenticated');
      return null;
    }
    state = state.copyWith(busy: true, clearError: true, clearCompletion: true);
    try {
      final idempotencyKey =
          'mobile-${listingId.substring(0, 8)}-${DateTime.now().millisecondsSinceEpoch}';
      final result = await ref.read(paymentsApiProvider).purchase(
            accessToken: token,
            listingId: listingId,
            pricingRuleId: pricingRuleId,
            durationHours: durationHours,
            idempotencyKey: idempotencyKey,
          );
      state = state.copyWith(busy: false, purchase: result);
      return result;
    } on PaymentsApiException catch (error) {
      state = state.copyWith(busy: false, error: error.message);
      return null;
    }
  }

  Future<PaymentCompletionResult?> completeMock({
    required String paymentId,
    String outcome = 'paid',
  }) async {
    final token = _token;
    if (token == null) {
      state = state.copyWith(error: 'Not authenticated');
      return null;
    }
    state = state.copyWith(busy: true, clearError: true);
    try {
      final result = await ref.read(paymentsApiProvider).mockComplete(
            accessToken: token,
            paymentId: paymentId,
            outcome: outcome,
          );
      state = state.copyWith(busy: false, completion: result);
      return result;
    } on PaymentsApiException catch (error) {
      state = state.copyWith(busy: false, error: error.message);
      return null;
    }
  }
}

final paymentsControllerProvider =
    NotifierProvider<PaymentsController, PaymentsUiState>(PaymentsController.new);
