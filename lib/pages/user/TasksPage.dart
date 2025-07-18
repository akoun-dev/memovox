import 'package:flutter/material.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import 'package:memovox/core/layout/AppDrawer.dart';
import 'package:memovox/models/task.dart';
import 'package:memovox/services/task_service.dart';
import 'package:memovox/services/notification_service.dart';
import 'package:memovox/widgets/TaskCard.dart';

class TasksPage extends StatefulWidget {
  const TasksPage({super.key});

  @override
  State<TasksPage> createState() => _TasksPageState();
}

class _TasksPageState extends State<TasksPage> {
  final TaskService _service = TaskService();
  final stt.SpeechToText _speech = stt.SpeechToText();

  List<Task> _tasks = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final data = await _service.getTasks();
    setState(() {
      _tasks = data;
      _loading = false;
    });
  }

  Future<void> _addTask(String desc) async {
    if (desc.trim().isEmpty) return;
    final task = await _service.createTask(description: desc.trim());
    setState(() => _tasks.add(task));
    await NotificationService.showNotification(
      title: 'Nouvelle tâche',
      body: desc,
    );
  }

  Future<void> _toggle(Task task) async {
    final updated = await _service.updateTask(Task(
      id: task.id,
      userId: task.userId,
      projectId: task.projectId,
      description: task.description,
      isCompleted: !task.isCompleted,
      createdAt: task.createdAt,
      updatedAt: DateTime.now(),
    ));
    setState(() {
      final index = _tasks.indexWhere((t) => t.id == task.id);
      if (index != -1) _tasks[index] = updated;
    });
  }

  Future<void> _delete(Task task) async {
    await _service.deleteTask(task.id);
    setState(() => _tasks.removeWhere((t) => t.id == task.id));
  }

  void _showAddDialog() {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Nouvelle tâche'),
        content: TextField(
          controller: controller,
          autofocus: true,
          decoration: const InputDecoration(hintText: 'Description'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _addTask(controller.text);
            },
            child: const Text('Ajouter'),
          ),
        ],
      ),
    );
  }

  Future<void> _startVoice() async {
    if (!await _speech.initialize()) return;
    await _speech.listen(onResult: (res) async {
      if (res.finalResult) {
        final text = res.recognizedWords;
        await _speech.stop();
        await _addTask(text);
      }
    });
  }

  void _showOptions(Task task) {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.delete),
              title: const Text('Supprimer'),
              onTap: () {
                Navigator.pop(context);
                _delete(task);
              },
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Tâches'),
        backgroundColor: Colors.indigo,
        actions: [
          IconButton(
            icon: const Icon(Icons.mic),
            onPressed: _startVoice,
          ),
        ],
      ),
      drawer: const AppDrawer(),
      floatingActionButton: FloatingActionButton(
        onPressed: _showAddDialog,
        child: const Icon(Icons.add),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(8),
              children: [
                for (final t in _tasks)
                  TaskCard(
                    title: t.description,
                    completed: t.isCompleted,
                    onToggle: () => _toggle(t),
                    onTap: () => _showOptions(t),
                  ),
              ],
            ),
    );
  }
}
