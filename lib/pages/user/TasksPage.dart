import 'package:flutter/material.dart';
import 'package:memovox/core/layout/AppDrawer.dart';

class TasksPage extends StatelessWidget {
  const TasksPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Tâches'),
        backgroundColor: Colors.indigo,
      ),
      drawer: const AppDrawer(),
      body: const Center(
        child: Text('Page des tâches - À implémenter'),
      ),
    );
  }
}