class AuthTokens {
  const AuthTokens({
    required this.accessToken,
    required this.refreshToken,
    required this.accessExpiresIn,
    required this.refreshExpiresIn,
  });

  final String accessToken;
  final String refreshToken;
  final int accessExpiresIn;
  final int refreshExpiresIn;

  factory AuthTokens.fromJson(Map<String, dynamic> json) {
    return AuthTokens(
      accessToken: json['accessToken'] as String,
      refreshToken: json['refreshToken'] as String,
      accessExpiresIn: (json['accessExpiresIn'] as num?)?.toInt() ?? 900,
      refreshExpiresIn: (json['refreshExpiresIn'] as num?)?.toInt() ?? 2592000,
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'accessToken': accessToken,
        'refreshToken': refreshToken,
        'accessExpiresIn': accessExpiresIn,
        'refreshExpiresIn': refreshExpiresIn,
      };
}

class UserProfile {
  const UserProfile({
    required this.id,
    this.email,
    this.phoneE164,
    this.displayName,
    this.preferredLanguageCode,
    this.roles = const <String>[],
  });

  final String id;
  final String? email;
  final String? phoneE164;
  final String? displayName;
  final String? preferredLanguageCode;
  final List<String> roles;

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      id: json['id'] as String,
      email: json['email'] as String?,
      phoneE164: json['phoneE164'] as String?,
      displayName: json['displayName'] as String?,
      preferredLanguageCode: json['preferredLanguageCode'] as String?,
      roles: (json['roles'] as List<dynamic>? ?? const <dynamic>[])
          .map((dynamic e) => e.toString())
          .toList(),
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
        'id': id,
        'email': email,
        'phoneE164': phoneE164,
        'displayName': displayName,
        'preferredLanguageCode': preferredLanguageCode,
        'roles': roles,
      };
}

class AuthResult {
  const AuthResult({
    required this.user,
    required this.tokens,
    required this.sessionId,
  });

  final UserProfile user;
  final AuthTokens tokens;
  final String sessionId;

  factory AuthResult.fromJson(Map<String, dynamic> json) {
    return AuthResult(
      user: UserProfile.fromJson(json['user'] as Map<String, dynamic>),
      tokens: AuthTokens.fromJson(json['tokens'] as Map<String, dynamic>),
      sessionId: json['sessionId'] as String,
    );
  }
}
