class ListingSummary {
  const ListingSummary({
    required this.id,
    required this.title,
    required this.status,
    required this.viewCount,
    this.priceAmount,
    this.currencyCode,
    this.coverImageUrl,
    this.rejectionReason,
  });

  final String id;
  final String title;
  final String status;
  final int viewCount;
  final double? priceAmount;
  final String? currencyCode;
  final String? coverImageUrl;
  final String? rejectionReason;

  factory ListingSummary.fromJson(Map<String, dynamic> json) {
    return ListingSummary(
      id: json['id'] as String,
      title: json['title'] as String,
      status: json['status'] as String? ?? 'draft',
      viewCount: (json['viewCount'] as num?)?.toInt() ?? 0,
      priceAmount: (json['priceAmount'] as num?)?.toDouble(),
      currencyCode: json['currencyCode'] as String?,
      coverImageUrl: json['coverImageUrl'] as String?,
      rejectionReason: json['rejectionReason'] as String?,
    );
  }
}

class ListingMedia {
  const ListingMedia({
    required this.id,
    required this.cdnUrl,
    required this.mimeType,
    required this.sortOrder,
  });

  final String id;
  final String cdnUrl;
  final String mimeType;
  final int sortOrder;

  factory ListingMedia.fromJson(Map<String, dynamic> json) {
    return ListingMedia(
      id: json['id'] as String,
      cdnUrl: json['cdnUrl'] as String,
      mimeType: json['mimeType'] as String? ?? 'image/jpeg',
      sortOrder: (json['sortOrder'] as num?)?.toInt() ?? 0,
    );
  }
}

class ListingAttributeValue {
  const ListingAttributeValue({
    required this.attributeDefinitionId,
    required this.code,
    this.valueText,
    this.valueNumber,
    this.valueBool,
  });

  final String attributeDefinitionId;
  final String code;
  final String? valueText;
  final double? valueNumber;
  final bool? valueBool;

  factory ListingAttributeValue.fromJson(Map<String, dynamic> json) {
    return ListingAttributeValue(
      attributeDefinitionId: json['attributeDefinitionId'] as String,
      code: json['code'] as String? ?? '',
      valueText: json['valueText'] as String?,
      valueNumber: (json['valueNumber'] as num?)?.toDouble(),
      valueBool: json['valueBool'] as bool?,
    );
  }
}

class ListingDetail {
  const ListingDetail({
    required this.id,
    required this.categoryId,
    required this.countryId,
    required this.title,
    required this.description,
    required this.status,
    required this.viewCount,
    this.priceAmount,
    this.currencyCode,
    this.cityId,
    this.rejectionReason,
    this.media = const <ListingMedia>[],
    this.attributes = const <ListingAttributeValue>[],
  });

  final String id;
  final String categoryId;
  final String countryId;
  final String? cityId;
  final String title;
  final String description;
  final String status;
  final int viewCount;
  final double? priceAmount;
  final String? currencyCode;
  final String? rejectionReason;
  final List<ListingMedia> media;
  final List<ListingAttributeValue> attributes;

  factory ListingDetail.fromJson(Map<String, dynamic> json) {
    return ListingDetail(
      id: json['id'] as String,
      categoryId: json['categoryId'] as String,
      countryId: json['countryId'] as String,
      cityId: json['cityId'] as String?,
      title: json['title'] as String,
      description: json['description'] as String? ?? '',
      status: json['status'] as String? ?? 'draft',
      viewCount: (json['viewCount'] as num?)?.toInt() ?? 0,
      priceAmount: (json['priceAmount'] as num?)?.toDouble(),
      currencyCode: json['currencyCode'] as String?,
      rejectionReason: json['rejectionReason'] as String?,
      media: (json['media'] as List<dynamic>? ?? const <dynamic>[])
          .whereType<Map<String, dynamic>>()
          .map(ListingMedia.fromJson)
          .toList(growable: false),
      attributes: (json['attributes'] as List<dynamic>? ?? const <dynamic>[])
          .whereType<Map<String, dynamic>>()
          .map(ListingAttributeValue.fromJson)
          .toList(growable: false),
    );
  }
}

class ListingPage {
  const ListingPage({
    required this.items,
    required this.page,
    required this.pageSize,
    required this.total,
  });

  final List<ListingSummary> items;
  final int page;
  final int pageSize;
  final int total;

  factory ListingPage.fromJson(Map<String, dynamic> json) {
    return ListingPage(
      items: (json['items'] as List<dynamic>? ?? const <dynamic>[])
          .whereType<Map<String, dynamic>>()
          .map(ListingSummary.fromJson)
          .toList(growable: false),
      page: (json['page'] as num?)?.toInt() ?? 1,
      pageSize: (json['pageSize'] as num?)?.toInt() ?? 20,
      total: (json['total'] as num?)?.toInt() ?? 0,
    );
  }
}
