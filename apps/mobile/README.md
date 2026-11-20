# Tarweej mobile (Flutter)

Riverpod + GoRouter shell for iOS, Android, and Chrome web.

## API base URL

`AppConfig.development` reads `API_BASE_URL` from `--dart-define`, defaulting to:

```text
http://localhost:3000/api/v1
```

That matches the Nest API when you run `pnpm dev` on port 3000.

```bash
# Default (localhost:3000)
flutter run -d chrome

# Explicit override
flutter run -d chrome --dart-define=API_BASE_URL=http://localhost:3000/api/v1

# Point at a remote API
flutter run -d chrome --dart-define=API_BASE_URL=https://api.example.com/api/v1
```

## Local CORS

Flutter Chrome uses a random origin (e.g. `http://localhost:61808`). In non-production the Nest API allows `localhost` / `127.0.0.1` on any port so Dio/XHR country and reference calls work without editing `CORS_ORIGINS` each run. Production still uses the exact `CORS_ORIGINS` allow-list only.

## Useful commands

```bash
flutter pub get
flutter gen-l10n
flutter analyze
flutter test
flutter run -d chrome
```
