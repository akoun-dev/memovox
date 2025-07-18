import 'package:supabase_flutter/supabase_flutter.dart';

class UserService {
  final SupabaseClient _supabase;

  UserService({SupabaseClient? client})
      : _supabase = client ?? Supabase.instance.client;

  Future<Map<String, dynamic>?> getProfile() async {
    final uid = _supabase.auth.currentUser?.id;
    if (uid == null) return null;
    final data = await _supabase
        .from('users')
        .select()
        .eq('id', uid)
        .single();
    return Map<String, dynamic>.from(data);
  }

  Future<void> updateProfile({
    required String firstName,
    required String lastName,
    required String phone,
  }) async {
    final uid = _supabase.auth.currentUser?.id;
    if (uid == null) return;
    await _supabase.from('users').update({
      'first_name': firstName,
      'last_name': lastName,
      'phone': phone,
    }).eq('id', uid);
  }
}
