class ReferenceCountry {
  const ReferenceCountry({
    required this.id,
    required this.iso2,
    required this.iso3,
    required this.dialingCode,
    required this.name,
    required this.isActive,
    this.primaryCurrencyCode,
    this.primaryLanguageCode,
  });

  final String id;
  final String iso2;
  final String iso3;
  final String dialingCode;
  final String name;
  final bool isActive;
  final String? primaryCurrencyCode;
  final String? primaryLanguageCode;

  factory ReferenceCountry.fromJson(Map<String, dynamic> json) {
    String? primaryOf(List<dynamic>? rows, String codeKey) {
      if (rows == null) {
        return null;
      }
      for (final row in rows) {
        if (row is Map<String, dynamic> && row['isPrimary'] == true) {
          return row[codeKey]?.toString();
        }
      }
      return null;
    }

    return ReferenceCountry(
      id: json['id'] as String,
      iso2: json['iso2'] as String,
      iso3: json['iso3'] as String,
      dialingCode: json['dialingCode'] as String,
      name: (json['name'] as String?) ?? (json['iso2'] as String),
      isActive: json['isActive'] as bool? ?? true,
      primaryCurrencyCode: primaryOf(json['currencies'] as List<dynamic>?, 'code'),
      primaryLanguageCode: primaryOf(json['languages'] as List<dynamic>?, 'code'),
    );
  }
}

class ReferenceCity {
  const ReferenceCity({
    required this.id,
    required this.name,
    required this.regionId,
    required this.countryId,
  });

  final String id;
  final String name;
  final String regionId;
  final String countryId;

  factory ReferenceCity.fromJson(Map<String, dynamic> json) {
    return ReferenceCity(
      id: json['id'] as String,
      name: (json['name'] as String?) ?? (json['defaultName'] as String? ?? ''),
      regionId: json['regionId'] as String,
      countryId: json['countryId'] as String,
    );
  }
}
