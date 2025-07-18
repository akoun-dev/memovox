import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:memovox/services/task_service.dart';
import 'package:memovox/widgets/TaskCard.dart';

import 'test_helpers/fake_supabase.dart';

class TaskListWidget extends StatelessWidget {
  final TaskService service;
  const TaskListWidget({super.key, required this.service});

  @override
  Widget build(BuildContext context) {
    return FutureBuilder(
      future: service.getTasks(),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const CircularProgressIndicator();
        }
        final tasks = snapshot.data!;
        return ListView(
          children: [
            for (final t in tasks)
              TaskCard(title: t.description, completed: t.isCompleted),
          ],
        );
      },
    );
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('TaskListWidget displays tasks from service', (tester) async {
    final client = FakeSupabaseClient();
    client.auth.currentUser = FakeUser('u1');
    client.tasks.add({
      'id': 't1',
      'user_id': 'u1',
      'description': 'Widget task',
      'is_completed': false,
      'created_at': DateTime.now().toIso8601String(),
      'updated_at': DateTime.now().toIso8601String(),
    });
    final service = TaskService(client: client);

    await tester.pumpWidget(MaterialApp(home: TaskListWidget(service: service)));
    await tester.pumpAndSettle();

    expect(find.text('Widget task'), findsOneWidget);
  });
}
