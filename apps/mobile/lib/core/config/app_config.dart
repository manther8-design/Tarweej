class AppConfig {
  const AppConfig({
    required this.apiBaseUrl,
  });

  final String apiBaseUrl;

  static const AppConfig development = AppConfig(
    apiBaseUrl: String.fromEnvironment(
      'API_BASE_URL',
      defaultValue: 'http://localhost:3000/api/v1',
    ),
  );
}
