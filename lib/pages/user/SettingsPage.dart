import 'package:flutter/material.dart';
import 'package:memovox/core/layout/AppDrawer.dart';
import 'package:memovox/services/theme_provider.dart';
import 'package:provider/provider.dart';

class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  @override
  Widget build(BuildContext context) {
    final themeProvider = Provider.of<ThemeProvider>(context);
    final darkMode = themeProvider.mode == ThemeMode.dark;

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
            value: darkMode,
            onChanged: (val) {
              themeProvider.update(val ? ThemeMode.dark : ThemeMode.light);
            },
          ),
        ],
      ),
    );
  }
}