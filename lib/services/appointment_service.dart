import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/appointment.dart';

class AppointmentService {
  final dynamic _supabase;

  AppointmentService({dynamic client})
      : _supabase = client ?? Supabase.instance.client;
  Future<List<Appointment>> getAppointments() async {
    final List<dynamic> data = await _supabase
        .from('appointments')
        .select()
        .eq('user_id', _supabase.auth.currentUser!.id);
    return List<Appointment>.from(data.map((json) => Appointment.fromJson(json as Map<String, dynamic>)));
  }

  Future<Appointment> createAppointment({
    required String title,
    required String location,
    required DateTime dateTime,
  }) async {
    final data = await _supabase.from('appointments').insert({
      'user_id': _supabase.auth.currentUser!.id,
      'title': title,
      'location': location,
      'date_time': dateTime.toIso8601String(),
    }).select().single();

    return Appointment.fromJson(data);
  }

  Future<Appointment> updateAppointment(Appointment appointment) async {
    final data = await _supabase
        .from('appointments')
        .update(appointment.toJson())
        .eq('id', appointment.id)
        .select()
        .single();

    return Appointment.fromJson(data);
  }

  Future<void> deleteAppointment(String appointmentId) async {
    await _supabase.from('appointments').delete().eq('id', appointmentId);
  }
}
