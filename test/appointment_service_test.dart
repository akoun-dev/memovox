import 'package:flutter_test/flutter_test.dart';
import 'package:memovox/services/appointment_service.dart';

import 'test_helpers/fake_supabase.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('AppointmentService', () {
    late FakeSupabaseClient client;
    late AppointmentService service;

    setUp(() {
      client = FakeSupabaseClient();
      client.auth.currentUser = FakeUser('u1');
      service = AppointmentService(client: client);
      client.appointments.add({
        'id': 'a1',
        'user_id': 'u1',
        'title': 'Meet',
        'location': 'Home',
        'date_time': DateTime.parse('2025-01-01T10:00:00Z').toIso8601String(),
        'created_at': DateTime.now().toIso8601String(),
        'updated_at': DateTime.now().toIso8601String(),
      });
    });

    test('getAppointments returns user appointments', () async {
      final list = await service.getAppointments();
      expect(list.length, 1);
      expect(list.first.title, 'Meet');
    });
  });
}
