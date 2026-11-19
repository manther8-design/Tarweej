class FavoriteListingSummary {
  const FavoriteListingSummary({
    required this.id,
    required this.title,
    required this.status,
    this.priceAmount,
    this.currencyCode,
    this.deletedAt,
    this.thumbnailUrl,
  });

  final String id;
  final String title;
  final String status;
  final double? priceAmount;
  final String? currencyCode;
  final String? deletedAt;
  final String? thumbnailUrl;

  factory FavoriteListingSummary.fromJson(Map<String, dynamic> json) {
    return FavoriteListingSummary(
      id: json['id'] as String,
      title: json['title'] as String? ?? '',
      status: json['status'] as String? ?? 'unknown',
      priceAmount: (json['priceAmount'] as num?)?.toDouble(),
      currencyCode: json['currencyCode'] as String?,
      deletedAt: json['deletedAt'] as String?,
      thumbnailUrl: json['thumbnailUrl'] as String?,
    );
  }
}

class FavoriteItem {
  const FavoriteItem({
    required this.id,
    required this.listingId,
    required this.createdAt,
    required this.availability,
    this.listing,
  });

  final String id;
  final String listingId;
  final String createdAt;
  final String availability;
  final FavoriteListingSummary? listing;

  factory FavoriteItem.fromJson(Map<String, dynamic> json) {
    final listingJson = json['listing'];
    return FavoriteItem(
      id: json['id'] as String,
      listingId: json['listingId'] as String,
      createdAt: json['createdAt'] as String? ?? '',
      availability: json['availability'] as String? ?? 'unavailable',
      listing: listingJson is Map<String, dynamic>
          ? FavoriteListingSummary.fromJson(listingJson)
          : null,
    );
  }
}

class FavoritePage {
  const FavoritePage({
    required this.page,
    required this.pageSize,
    required this.total,
    required this.items,
  });

  final int page;
  final int pageSize;
  final int total;
  final List<FavoriteItem> items;

  factory FavoritePage.fromJson(Map<String, dynamic> json) {
    final rawItems = json['items'];
    return FavoritePage(
      page: json['page'] as int? ?? 1,
      pageSize: json['pageSize'] as int? ?? 20,
      total: json['total'] as int? ?? 0,
      items: rawItems is List
          ? rawItems
              .whereType<Map<String, dynamic>>()
              .map(FavoriteItem.fromJson)
              .toList(growable: false)
          : const <FavoriteItem>[],
    );
  }
}
