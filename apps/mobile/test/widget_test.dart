import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:tarweej_mobile/app/tarweej_app.dart';

void main() {
  testWidgets('renders splash brand', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: TarweejApp()));
    await tester.pump();
    expect(find.textContaining('ترويج'), findsOneWidget);
    // Advance past splash Timer so no pending timers remain.
    await tester.pump(const Duration(milliseconds: 1000));
  });
}
