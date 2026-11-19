import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:tarweej_mobile/app/tarweej_app.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() async {
    SharedPreferences.setMockInitialValues(<String, Object>{
      // Skip country gate so splash can settle without a live API.
      'reference.selected_country_id': '00000000-0000-0000-0000-000000000001',
      'reference.selected_country_iso2': 'SA',
      'reference.selected_country_name': 'Saudi Arabia',
    });
  });

  testWidgets('renders splash brand', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: TarweejApp()));
    await tester.pump();
    expect(find.textContaining('ترويج'), findsWidgets);
    await tester.pump(const Duration(milliseconds: 1200));
  });
}
