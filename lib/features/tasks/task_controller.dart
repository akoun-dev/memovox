import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'task.dart';
import 'task_repository.dart';

final taskRepositoryProvider = Provider<TaskRepository>((ref) {
  return TaskRepository();
});

final tasksProvider = StateNotifierProvider<TasksNotifier, AsyncValue<List<Task>>>((ref) {
  final repo = ref.watch(taskRepositoryProvider);
  return TasksNotifier(repo)..loadTasks();
});

class TasksNotifier extends StateNotifier<AsyncValue<List<Task>>> {
  final TaskRepository _repository;
  TasksNotifier(this._repository) : super(const AsyncValue.loading());

  Future<void> loadTasks() async {
    try {
      final tasks = await _repository.getTasks();
      state = AsyncValue.data(tasks);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> addTask(String title) async {
    await _repository.addTask(title);
    await loadTasks();
  }

  Future<void> toggle(Task task) async {
    await _repository.toggleTask(task);
    await loadTasks();
  }
}
