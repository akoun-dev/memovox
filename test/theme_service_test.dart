import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:memovox/services/theme_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('save and load theme mode', () async {
    SharedPreferences.setMockInitialValues({});
    await ThemeService.saveThemeMode(ThemeMode.dark);
    final mode = await ThemeService.loadThemeMode();
    expect(mode, ThemeMode.dark);
  });
}

