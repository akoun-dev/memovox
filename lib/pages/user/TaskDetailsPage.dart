import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:memovox/models/task.dart';

class TaskDetailsPage extends StatelessWidget {
  final Map<String, dynamic> task;
  final VoidCallback? onUpdate;

  const TaskDetailsPage({super.key, required this.task, this.onUpdate});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Détails de la tâche'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              task['description'] ?? '',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 16),
            Text('Date: ${DateFormat('dd/MM/yyyy HH:mm').format(task['dateTime'] as DateTime)}'),
            const SizedBox(height: 8),
            Text('Statut: ${task['is_completed'] ? 'Terminé' : 'À faire'}'),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {
                if (onUpdate != null) onUpdate!();
                Navigator.pop(context);
              },
              child: const Text('Mettre à jour'),
            ),
          ],
        ),
      ),
    );
  }
}