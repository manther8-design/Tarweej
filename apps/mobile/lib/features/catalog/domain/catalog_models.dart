class CatalogCategory {
  const CatalogCategory({
    required this.id,
    required this.slug,
    required this.name,
    required this.listingType,
    required this.sortOrder,
    this.parentId,
    this.children = const <CatalogCategory>[],
  });

  final String id;
  final String? parentId;
  final String slug;
  final String name;
  final String listingType;
  final int sortOrder;
  final List<CatalogCategory> children;

  factory CatalogCategory.fromJson(Map<String, dynamic> json) {
    final rawChildren = json['children'];
    final children = rawChildren is List
        ? rawChildren
            .whereType<Map<String, dynamic>>()
            .map(CatalogCategory.fromJson)
            .toList(growable: false)
        : const <CatalogCategory>[];

    return CatalogCategory(
      id: json['id'] as String,
      parentId: json['parentId'] as String?,
      slug: json['slug'] as String,
      name: json['name'] as String,
      listingType: json['listingType'] as String? ?? 'marketplace',
      sortOrder: (json['sortOrder'] as num?)?.toInt() ?? 0,
      children: children,
    );
  }
}

class CatalogAttributeOption {
  const CatalogAttributeOption({
    required this.id,
    required this.value,
    required this.label,
    required this.sortOrder,
  });

  final String id;
  final String value;
  final String label;
  final int sortOrder;

  factory CatalogAttributeOption.fromJson(Map<String, dynamic> json) {
    return CatalogAttributeOption(
      id: json['id'] as String,
      value: json['value'] as String,
      label: json['label'] as String,
      sortOrder: (json['sortOrder'] as num?)?.toInt() ?? 0,
    );
  }
}

class CatalogAttribute {
  const CatalogAttribute({
    required this.id,
    required this.attributeDefinitionId,
    required this.code,
    required this.name,
    required this.dataType,
    required this.isRequired,
    required this.sortOrder,
    this.unit,
    this.options = const <CatalogAttributeOption>[],
  });

  final String id;
  final String attributeDefinitionId;
  final String code;
  final String name;
  final String dataType;
  final String? unit;
  final bool isRequired;
  final int sortOrder;
  final List<CatalogAttributeOption> options;

  factory CatalogAttribute.fromJson(Map<String, dynamic> json) {
    final rawOptions = json['options'];
    final options = rawOptions is List
        ? rawOptions
            .whereType<Map<String, dynamic>>()
            .map(CatalogAttributeOption.fromJson)
            .toList(growable: false)
        : const <CatalogAttributeOption>[];

    return CatalogAttribute(
      id: json['id'] as String,
      attributeDefinitionId: json['attributeDefinitionId'] as String,
      code: json['code'] as String,
      name: json['name'] as String,
      dataType: json['dataType'] as String,
      unit: json['unit'] as String?,
      isRequired: json['isRequired'] as bool? ?? false,
      sortOrder: (json['sortOrder'] as num?)?.toInt() ?? 0,
      options: options,
    );
  }
}

class CatalogCategoryDetail {
  const CatalogCategoryDetail({
    required this.id,
    required this.slug,
    required this.name,
    required this.listingType,
    required this.sortOrder,
    this.parentId,
    this.attributes = const <CatalogAttribute>[],
  });

  final String id;
  final String? parentId;
  final String slug;
  final String name;
  final String listingType;
  final int sortOrder;
  final List<CatalogAttribute> attributes;

  factory CatalogCategoryDetail.fromJson(Map<String, dynamic> json) {
    final rawAttrs = json['attributes'];
    final attributes = rawAttrs is List
        ? rawAttrs
            .whereType<Map<String, dynamic>>()
            .map(CatalogAttribute.fromJson)
            .toList(growable: false)
        : const <CatalogAttribute>[];

    return CatalogCategoryDetail(
      id: json['id'] as String,
      parentId: json['parentId'] as String?,
      slug: json['slug'] as String,
      name: json['name'] as String,
      listingType: json['listingType'] as String? ?? 'marketplace',
      sortOrder: (json['sortOrder'] as num?)?.toInt() ?? 0,
      attributes: attributes,
    );
  }
}
