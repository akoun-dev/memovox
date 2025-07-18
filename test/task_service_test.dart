import 'package:flutter_test/flutter_test.dart';
import 'package:memovox/services/task_service.dart';
import 'package:memovox/models/task.dart';

import 'test_helpers/fake_supabase.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('TaskService', () {
    late FakeSupabaseClient client;
    late TaskService service;

    setUp(() {
      client = FakeSupabaseClient();
      client.auth.currentUser = FakeUser('u1');
      service = TaskService(client: client);
    });

    test('getTasks returns existing tasks', () async {
      client.tasks.add({
        'id': 't1',
        'user_id': 'u1',
        'description': 'demo',
        'is_completed': false,
        'created_at': DateTime.now().toIso8601String(),
        'updated_at': DateTime.now().toIso8601String(),
      });

      final tasks = await service.getTasks();
      expect(tasks.length, 1);
      expect(tasks.first.description, 'demo');
    });

    test('createTask inserts new task', () async {
      final task = await service.createTask(description: 'new task');
      expect(client.tasks.length, 1);
      expect(task.description, 'new task');
    });

    test('updateTask updates task', () async {
      final created = await service.createTask(description: 'old');
      final updated = await service.updateTask(Task(
        id: created.id,
        userId: 'u1',
        description: 'updated',
        isCompleted: false,
        projectId: null,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      ));
      expect(updated.description, 'updated');
    });

    test('deleteTask removes task', () async {
      final created = await service.createTask(description: 'to delete');
      await service.deleteTask(created.id);
      expect(client.tasks, isEmpty);
    });
  });
}
