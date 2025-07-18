import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:memovox/services/auth_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('AuthService', () {
    setUp(() {
      SharedPreferences.setMockInitialValues({});
    });

    test('login sets authentication flag', () async {
      await AuthService.login();
      final prefs = await SharedPreferences.getInstance();
      expect(prefs.getBool('isAuthenticated'), isTrue);
    });

    test('logout clears authentication flag', () async {
      await AuthService.login();
      await AuthService.logout();
      final prefs = await SharedPreferences.getInstance();
      expect(prefs.getBool('isAuthenticated'), isFalse);
    });
  });
}
