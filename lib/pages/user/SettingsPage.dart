import 'package:flutter/material.dart';
import 'package:memovox/core/layout/AppDrawer.dart';

class SettingsPage extends StatelessWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Paramètres'),
        backgroundColor: Colors.indigo,
      ),
      drawer: const AppDrawer(),
      body: const Center(
        child: Text('Page de paramètres'),
      ),
    );
  }
}