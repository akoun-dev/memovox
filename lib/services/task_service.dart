import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/task.dart';

class TaskService {
  final SupabaseClient _supabase;

  TaskService() : _supabase = Supabase.instance.client;

  Future<List<Task>> getTasks({String? projectId}) async {
    final query = _supabase
        .from('tasks')
        .select()
        .eq('user_id', _supabase.auth.currentUser!.id);

    if (projectId != null) {
      query.eq('project_id', projectId);
    }

    final data = await query;
    return data.map((json) => Task.fromJson(json)).toList();
  }

  Future<Task> createTask({
    required String description,
    String? projectId,
  }) async {
    final data = await _supabase.from('tasks').insert({
      'user_id': _supabase.auth.currentUser!.id,
      'project_id': projectId,
      'description': description,
    }).select().single();

    return Task.fromJson(data);
  }

  Future<Task> updateTask(Task task) async {
    final data = await _supabase
        .from('tasks')
        .update(task.toJson())
        .eq('id', task.id)
        .select()
        .single();

    return Task.fromJson(data);
  }

  Future<void> deleteTask(String taskId) async {
    await _supabase.from('tasks').delete().eq('id', taskId);
  }
}