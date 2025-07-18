import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:memovox/services/theme_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('ThemeController', () {
    late ThemeController controller;

    setUp(() {
      SharedPreferences.setMockInitialValues({});
      controller = ThemeController();
    });

    test('initial load defaults to light', () async {
      await controller.loadTheme();
      expect(controller.value, ThemeMode.light);
    });

    test('toggleTheme saves preference', () async {
      await controller.toggleTheme(true);
      expect(controller.value, ThemeMode.dark);
      final prefs = await SharedPreferences.getInstance();
      expect(prefs.getBool('themeMode'), isTrue);
    });
  });
}
