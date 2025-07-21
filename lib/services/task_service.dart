import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/task.dart';
// services/task_service.dart
class TaskService {
  final _supabase = Supabase.instance.client;

  Future<List<Task>> getTasks({
    DateTime? from,
    DateTime? to,
    String? projectId,
    bool? completed,
  }) async {
    var q = _supabase
        .from('tasks')
        .select()
        .eq('user_id', _supabase.auth.currentUser!.id);

    if (from != null) q = q.gte('due_date', from.toIso8601String());
    if (to != null) q = q.lte('due_date', to.toIso8601String());
    if (projectId != null) q = q.eq('project_id', projectId);
    if (completed != null) q = q.eq('is_completed', completed);

    final data = await q.order('due_date', ascending: true);
    return data.map((e) => Task(
          id: e['id'],
          userId: e['user_id'],
          projectId: e['project_id'],
          description: e['description'],
          dueDate: DateTime.tryParse(e['due_date'] ?? ''),
          isCompleted: e['is_completed'] ?? false,
          createdAt: DateTime.tryParse(e['created_at'] ?? ''),
          updatedAt: DateTime.tryParse(e['updated_at'] ?? ''),
        )).toList();
  }

  Future<List<Map<String, dynamic>>> getProjects() async =>
      _supabase.from('projects').select().eq(
          'user_id', _supabase.auth.currentUser!.id);

  Future<Task> createTask({
    required String description,
    String? projectId,
    DateTime? dueDate,
  }) async {
    final res = await _supabase.from('tasks').insert({
      'user_id': _supabase.auth.currentUser!.id,
      'description': description,
      'project_id': projectId,
      'due_date': dueDate?.toIso8601String(),
    }).select().single();
    return Task(
      id: res['id'],
      userId: res['user_id'],
      description: res['description'],
      dueDate: DateTime.tryParse(res['due_date'] ?? ''),
      projectId: res['project_id'],
      isCompleted: false,
    );
  }

  Future<void> updateTask(Task task) async =>
      _supabase.from('tasks').update({
        'description': task.description,
        'is_completed': task.isCompleted,
        'due_date': task.dueDate?.toIso8601String(),
        'updated_at': DateTime.now().toIso8601String()
      }).eq('id', task.id);

  Future<void> deleteTask(String id) async =>
      _supabase.from('tasks').delete().eq('id', id);
}