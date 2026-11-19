import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:tarweej_mobile/app/tarweej_app.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() async {
    SharedPreferences.setMockInitialValues(<String, Object>{});
  });

  testWidgets('renders splash brand', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: TarweejApp()));
    await tester.pump();
    expect(find.textContaining('ترويج'), findsWidgets);
    await tester.pump(const Duration(milliseconds: 1200));
  });
}
