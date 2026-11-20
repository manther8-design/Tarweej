import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:tarweej_mobile/app/tarweej_app.dart';
import 'package:tarweej_mobile/features/home/application/home_feed_controller.dart';
import 'package:tarweej_mobile/features/home/presentation/home_page.dart';

class _QuietHomeFeed extends HomeFeedController {
  @override
  HomeFeedState build() => const HomeFeedState();

  @override
  Future<void> bootstrap() async {}

  @override
  Future<void> load({bool reset = false, bool refreshing = false}) async {}

  @override
  Future<void> loadMore() async {}

  @override
  Future<void> refresh() async {}

  @override
  Future<void> selectCategory(String? categoryId) async {}
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() async {
    SharedPreferences.setMockInitialValues(<String, Object>{
      'reference.selected_country_id': '00000000-0000-0000-0000-000000000001',
      'reference.selected_country_iso2': 'SA',
      'reference.selected_country_name': 'Saudi Arabia',
    });
  });

  testWidgets('renders splash brand then marketplace home', (WidgetTester tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          homeFeedControllerProvider.overrideWith(_QuietHomeFeed.new),
        ],
        child: const TarweejApp(),
      ),
    );
    await tester.pump();
    expect(find.textContaining('ترويج'), findsWidgets);

    // Clear splash routing timers and settle on home (feed bootstrap overridden).
    await tester.pump(const Duration(milliseconds: 700));
    await tester.pump(const Duration(milliseconds: 500));
    await tester.pump();

    expect(find.byType(HomePage), findsOneWidget);
    expect(find.textContaining('ترويج'), findsWidgets);
    // Exhaust any leftover microtasks/timers from auth/reference bootstrap.
    await tester.pump(const Duration(seconds: 1));
  });
}
