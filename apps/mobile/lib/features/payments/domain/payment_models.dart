class PricingPlan {
  const PricingPlan({
    required this.id,
    required this.countryId,
    required this.currencyCode,
    required this.placement,
    required this.pricePerHour,
    required this.maxSlots,
    required this.defaultDurationHours,
    required this.minDurationHours,
    required this.maxDurationHours,
  });

  final String id;
  final String countryId;
  final String currencyCode;
  final String placement;
  final double pricePerHour;
  final int maxSlots;
  final int defaultDurationHours;
  final int minDurationHours;
  final int maxDurationHours;

  factory PricingPlan.fromJson(Map<String, dynamic> json) {
    return PricingPlan(
      id: json['id'] as String,
      countryId: json['countryId'] as String,
      currencyCode: json['currencyCode'] as String,
      placement: json['placement'] as String,
      pricePerHour: double.parse(json['pricePerHour'].toString()),
      maxSlots: json['maxSlots'] as int,
      defaultDurationHours: json['defaultDurationHours'] as int,
      minDurationHours: json['minDurationHours'] as int? ?? 1,
      maxDurationHours: json['maxDurationHours'] as int? ?? 168,
    );
  }
}

class PaymentRecord {
  const PaymentRecord({
    required this.id,
    required this.status,
    required this.amount,
    required this.currencyCode,
    required this.providerCode,
    this.providerReference,
    this.failureReason,
    this.paidAt,
  });

  final String id;
  final String status;
  final String amount;
  final String currencyCode;
  final String providerCode;
  final String? providerReference;
  final String? failureReason;
  final String? paidAt;

  factory PaymentRecord.fromJson(Map<String, dynamic> json) {
    return PaymentRecord(
      id: json['id'] as String,
      status: json['status'] as String,
      amount: json['amount'].toString(),
      currencyCode: json['currencyCode'] as String,
      providerCode: json['providerCode'] as String,
      providerReference: json['providerReference'] as String?,
      failureReason: json['failureReason'] as String?,
      paidAt: json['paidAt']?.toString(),
    );
  }
}

class PromotionRecord {
  const PromotionRecord({
    required this.id,
    required this.listingId,
    required this.paymentId,
    required this.status,
    required this.placement,
    required this.durationHours,
    this.startsAt,
    this.endsAt,
    this.isFeaturedVisible = false,
  });

  final String id;
  final String listingId;
  final String paymentId;
  final String status;
  final String placement;
  final int durationHours;
  final String? startsAt;
  final String? endsAt;
  final bool isFeaturedVisible;

  factory PromotionRecord.fromJson(Map<String, dynamic> json) {
    return PromotionRecord(
      id: json['id'] as String,
      listingId: json['listingId'] as String,
      paymentId: json['paymentId'] as String,
      status: json['status'] as String,
      placement: json['placement'] as String,
      durationHours: json['durationHours'] as int,
      startsAt: json['startsAt']?.toString(),
      endsAt: json['endsAt']?.toString(),
      isFeaturedVisible: json['isFeaturedVisible'] == true,
    );
  }
}

class PurchaseResult {
  const PurchaseResult({
    required this.payment,
    required this.promotion,
    required this.checkoutToken,
    required this.sandbox,
    required this.reused,
  });

  final PaymentRecord payment;
  final PromotionRecord? promotion;
  final String? checkoutToken;
  final bool sandbox;
  final bool reused;

  factory PurchaseResult.fromJson(Map<String, dynamic> json) {
    final checkout = json['checkout'] as Map<String, dynamic>? ?? <String, dynamic>{};
    final promotionJson = json['promotion'] as Map<String, dynamic>?;
    return PurchaseResult(
      payment: PaymentRecord.fromJson(json['payment'] as Map<String, dynamic>),
      promotion: promotionJson == null ? null : PromotionRecord.fromJson(promotionJson),
      checkoutToken: checkout['checkoutToken'] as String?,
      sandbox: checkout['sandbox'] == true,
      reused: json['reused'] == true,
    );
  }
}

class PaymentCompletionResult {
  const PaymentCompletionResult({
    required this.payment,
    this.promotion,
    this.duplicate = false,
  });

  final PaymentRecord payment;
  final PromotionRecord? promotion;
  final bool duplicate;

  factory PaymentCompletionResult.fromJson(Map<String, dynamic> json) {
    final promotionJson = json['promotion'] as Map<String, dynamic>?;
    return PaymentCompletionResult(
      payment: PaymentRecord.fromJson(json['payment'] as Map<String, dynamic>),
      promotion: promotionJson == null ? null : PromotionRecord.fromJson(promotionJson),
      duplicate: json['duplicate'] == true,
    );
  }
}
