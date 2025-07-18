import 'package:flutter/material.dart';
import 'package:memovox/core/layout/AppDrawer.dart';
import 'package:memovox/services/theme_service.dart';

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  bool _darkMode = false;

  @override
  void initState() {
    super.initState();
    _darkMode = themeController.value == ThemeMode.dark;
  }

  void _toggle(bool value) {
    setState(() => _darkMode = value);
    themeController.toggleTheme(value);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Paramètres'),
        backgroundColor: Colors.indigo,
      ),
      drawer: const AppDrawer(),
      body: ListView(
        children: [
          SwitchListTile(
            title: const Text('Mode sombre'),
            value: _darkMode,
            onChanged: _toggle,
          ),
        ],
      ),
    );
  }
}