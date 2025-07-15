import 'package:supabase_flutter/supabase_flutter.dart';
import 'task.dart';
import '../../services/supabase_service.dart';

class TaskRepository {
  final SupabaseClient _client = SupabaseService().client;

  Future<List<Task>> getTasks() async {
    final response = await _client.from('tasks').select();
    final data = response as List<dynamic>;
    return data.map((e) => Task.fromMap(e as Map<String, dynamic>)).toList();
  }

  Future<void> addTask(String title) async {
    await _client.from('tasks').insert({'title': title});
  }

  Future<void> toggleTask(Task task) async {
    await _client.from('tasks').update({'completed': !task.completed}).eq('id', task.id);
  }
}
