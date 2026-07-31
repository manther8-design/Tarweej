import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tarweej_mobile/main.dart';

void main() {
  testWidgets('shows Tarweej brand', (tester) async {
    await tester.pumpWidget(const ProviderScope(child: TarweejApp()));
    await tester.pumpAndSettle();
    expect(find.text('ترويج'), findsOneWidget);
  });
}
