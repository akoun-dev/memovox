import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../tasks/task_controller.dart';
import '../tasks/task.dart';

class HomePage extends ConsumerWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tasksAsync = ref.watch(tasksProvider);
    final textController = TextEditingController();

    return Scaffold(
      appBar: AppBar(title: const Text('MemoVox')),
      body: tasksAsync.when(
        data: (tasks) => Column(
          children: [
            Expanded(
              child: ListView.builder(
                itemCount: tasks.length,
                itemBuilder: (context, index) {
                  final task = tasks[index];
                  return ListTile(
                    title: Text(task.title),
                    leading: Checkbox(
                      value: task.completed,
                      onChanged: (_) => ref.read(tasksProvider.notifier).toggle(task),
                    ),
                  );
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(8.0),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: textController,
                      decoration: const InputDecoration(labelText: 'Nouvelle tâche'),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.add),
                    onPressed: () {
                      final text = textController.text.trim();
                      if (text.isNotEmpty) {
                        ref.read(tasksProvider.notifier).addTask(text);
                        textController.clear();
                      }
                    },
                  )
                ],
              ),
            )
          ],
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Erreur: $e')),
      ),
    );
  }
}
