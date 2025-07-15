import 'package:supabase_flutter/supabase_flutter.dart';
import '../core/env.dart';

class SupabaseService {
  static final SupabaseService _instance = SupabaseService._internal();

  factory SupabaseService() => _instance;

  SupabaseService._internal();

  Future<void> init() async {
    await Env.load();
    await Supabase.initialize(
      url: Env.supabaseUrl,
      anonKey: Env.supabaseAnonKey,
    );
  }

  SupabaseClient get client => Supabase.instance.client;
}
