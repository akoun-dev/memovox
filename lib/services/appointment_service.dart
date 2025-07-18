import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/appointment.dart';

class AppointmentService {
  final dynamic _supabase;

  AppointmentService({dynamic client})
      : _supabase = client ?? Supabase.instance.client;

  Future<List<Appointment>> getAppointments() async {
    final data = await _supabase
        .from('appointments')
        .select()
        .eq('user_id', _supabase.auth.currentUser!.id);
    return (data as List)
        .map((json) => Appointment.fromJson(json as Map<String, dynamic>))
        .toList();
  }
}
