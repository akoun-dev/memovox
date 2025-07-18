import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ThemeController extends ValueNotifier<ThemeMode> {
  static const _prefKey = 'themeMode';

  ThemeController() : super(ThemeMode.light);

  Future<void> loadTheme() async {
    final prefs = await SharedPreferences.getInstance();
    final isDark = prefs.getBool(_prefKey) ?? false;
    value = isDark ? ThemeMode.dark : ThemeMode.light;
  }

  Future<void> toggleTheme(bool isDark) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_prefKey, isDark);
    value = isDark ? ThemeMode.dark : ThemeMode.light;
  }
}
