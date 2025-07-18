import 'package:memovox/main.dart';
import 'package:flutter_test/flutter_test.dart';


void main() {
  testWidgets('App renders correctly', (WidgetTester tester) async {
    // Build our app and trigger a frame
    await tester.pumpWidget(const Memovox(initialRoute: '/'));

    // Verify the app title is present
    expect(find.text('MemoVox'), findsOneWidget);
  });
}
