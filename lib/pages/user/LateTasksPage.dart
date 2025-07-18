import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class LateTasksPage extends StatelessWidget {
  final List<Map<String, dynamic>> tasks;

  const LateTasksPage({super.key, required this.tasks});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Tâches en retard'),
      ),
      body: ListView.builder(
        itemCount: tasks.length,
        itemBuilder: (context, index) {
          final task = tasks[index];
          return ListTile(
            title: Text(task['description'] ?? ''),
            subtitle: Text(
              'Échéance: ${DateFormat('dd/MM/yyyy HH:mm').format(task['dateTime'] as DateTime)}',
            ),
          );
        },
      ),
    );
  }
}