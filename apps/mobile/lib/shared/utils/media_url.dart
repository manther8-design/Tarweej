import 'package:tarweej_mobile/core/config/app_config.dart';

/// Rewrites seed/CDN hosts so media loads against the same API host the app uses
/// (e.g. Android emulator `10.0.2.2` instead of `localhost`).
String? resolveMediaUrl(String? raw, {AppConfig config = AppConfig.development}) {
  if (raw == null) {
    return null;
  }
  final trimmed = raw.trim();
  if (trimmed.isEmpty) {
    return null;
  }

  final api = Uri.parse(config.apiBaseUrl);
  final uri = Uri.tryParse(trimmed);
  if (uri == null) {
    return trimmed;
  }

  if (!uri.hasScheme) {
    final base = config.apiBaseUrl.replaceAll(RegExp(r'/api/v1/?$'), '');
    final path = trimmed.startsWith('/') ? trimmed : '/$trimmed';
    return '$base$path';
  }

  final host = uri.host.toLowerCase();
  if (host == 'localhost' || host == '127.0.0.1') {
    return uri
        .replace(
          host: api.host,
          port: api.hasPort ? api.port : null,
        )
        .toString();
  }

  return trimmed;
}
