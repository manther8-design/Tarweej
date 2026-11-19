class SearchListingHit {
  const SearchListingHit({
    required this.id,
    required this.title,
    required this.status,
    required this.viewCount,
    required this.isFeaturedCached,
    this.priceAmount,
    this.currencyCode,
    this.coverImageUrl,
    this.categoryId,
    this.cityId,
    this.countryId,
  });

  final String id;
  final String title;
  final String status;
  final int viewCount;
  final bool isFeaturedCached;
  final double? priceAmount;
  final String? currencyCode;
  final String? coverImageUrl;
  final String? categoryId;
  final String? cityId;
  final String? countryId;

  factory SearchListingHit.fromJson(Map<String, dynamic> json) {
    return SearchListingHit(
      id: json['id'] as String,
      title: json['title'] as String,
      status: json['status'] as String? ?? 'active',
      viewCount: (json['viewCount'] as num?)?.toInt() ?? 0,
      isFeaturedCached: json['isFeaturedCached'] as bool? ?? false,
      priceAmount: (json['priceAmount'] as num?)?.toDouble(),
      currencyCode: json['currencyCode'] as String?,
      coverImageUrl: json['coverImageUrl'] as String?,
      categoryId: json['categoryId'] as String?,
      cityId: json['cityId'] as String?,
      countryId: json['countryId'] as String?,
    );
  }
}

class SearchPageResult {
  const SearchPageResult({
    required this.items,
    required this.page,
    required this.pageSize,
    required this.total,
    this.cached = false,
  });

  final List<SearchListingHit> items;
  final int page;
  final int pageSize;
  final int total;
  final bool cached;

  factory SearchPageResult.fromJson(Map<String, dynamic> json) {
    return SearchPageResult(
      items: (json['items'] as List<dynamic>? ?? const <dynamic>[])
          .whereType<Map<String, dynamic>>()
          .map(SearchListingHit.fromJson)
          .toList(growable: false),
      page: (json['page'] as num?)?.toInt() ?? 1,
      pageSize: (json['pageSize'] as num?)?.toInt() ?? 20,
      total: (json['total'] as num?)?.toInt() ?? 0,
      cached: json['cached'] as bool? ?? false,
    );
  }
}

class SearchAttributeFilter {
  const SearchAttributeFilter({
    required this.attributeDefinitionId,
    this.eq,
    this.min,
    this.max,
    this.boolValue,
  });

  final String attributeDefinitionId;
  final String? eq;
  final double? min;
  final double? max;
  final bool? boolValue;

  Map<String, dynamic> toJson() {
    return <String, dynamic>{
      'attributeDefinitionId': attributeDefinitionId,
      if (eq != null) 'eq': eq,
      if (min != null) 'min': min,
      if (max != null) 'max': max,
      if (boolValue != null) 'bool': boolValue,
    };
  }
}

class SearchQuery {
  const SearchQuery({
    this.q,
    this.categoryId,
    this.cityId,
    this.countryId,
    this.minPrice,
    this.maxPrice,
    this.featured,
    this.sort = 'newest',
    this.page = 1,
    this.pageSize = 20,
    this.attributes = const <SearchAttributeFilter>[],
  });

  final String? q;
  final String? categoryId;
  final String? cityId;
  final String? countryId;
  final double? minPrice;
  final double? maxPrice;
  final bool? featured;
  final String sort;
  final int page;
  final int pageSize;
  final List<SearchAttributeFilter> attributes;

  SearchQuery copyWith({
    String? q,
    String? categoryId,
    String? cityId,
    String? countryId,
    double? minPrice,
    double? maxPrice,
    bool? featured,
    String? sort,
    int? page,
    int? pageSize,
    List<SearchAttributeFilter>? attributes,
    bool clearCategory = false,
    bool clearCity = false,
    bool clearMinPrice = false,
    bool clearMaxPrice = false,
    bool clearFeatured = false,
    bool clearQ = false,
  }) {
    return SearchQuery(
      q: clearQ ? null : (q ?? this.q),
      categoryId: clearCategory ? null : (categoryId ?? this.categoryId),
      cityId: clearCity ? null : (cityId ?? this.cityId),
      countryId: countryId ?? this.countryId,
      minPrice: clearMinPrice ? null : (minPrice ?? this.minPrice),
      maxPrice: clearMaxPrice ? null : (maxPrice ?? this.maxPrice),
      featured: clearFeatured ? null : (featured ?? this.featured),
      sort: sort ?? this.sort,
      page: page ?? this.page,
      pageSize: pageSize ?? this.pageSize,
      attributes: attributes ?? this.attributes,
    );
  }
}
