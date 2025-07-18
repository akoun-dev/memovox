import 'package:flutter/material.dart';
import 'theme_service.dart';

class ThemeProvider extends ChangeNotifier {
  ThemeMode _mode = ThemeMode.system;

  ThemeMode get mode => _mode;

  Future<void> load() async {
    _mode = await ThemeService.loadThemeMode();
    notifyListeners();
  }

  Future<void> update(ThemeMode mode) async {
    _mode = mode;
    await ThemeService.saveThemeMode(mode);
    notifyListeners();
  }
}
