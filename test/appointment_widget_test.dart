import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:memovox/services/appointment_service.dart';
import 'package:memovox/widgets/AppointmentTile.dart';

import 'test_helpers/fake_supabase.dart';

class AppointmentListWidget extends StatelessWidget {
  final AppointmentService service;
  const AppointmentListWidget({super.key, required this.service});

  @override
  Widget build(BuildContext context) {
    return FutureBuilder(
      future: service.getAppointments(),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const CircularProgressIndicator();
        }
        final apps = snapshot.data!;
        return ListView(
          children: [
            for (final a in apps)
              AppointmentTile(
                title: a.title,
                location: a.location,
                dateTime: a.dateTime,
              ),
          ],
        );
      },
    );
  }
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('AppointmentListWidget displays appointments', (tester) async {
    final client = FakeSupabaseClient();
    client.auth.currentUser = FakeUser('u1');
    client.appointments.add({
      'id': 'a1',
      'user_id': 'u1',
      'title': 'Dentist',
      'location': 'Clinic',
      'date_time': DateTime.parse('2025-01-01T09:00:00Z').toIso8601String(),
      'created_at': DateTime.now().toIso8601String(),
      'updated_at': DateTime.now().toIso8601String(),
    });
    final service = AppointmentService(client: client);

    await tester.pumpWidget(
      MaterialApp(home: AppointmentListWidget(service: service)),
    );
    await tester.pumpAndSettle();

    expect(find.text('Dentist'), findsOneWidget);
    expect(find.textContaining('Clinic'), findsOneWidget);
  });
}
