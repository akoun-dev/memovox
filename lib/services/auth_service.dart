import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:memovox/main.dart';

class AuthService {
  static const String _authKey = 'isAuthenticated';

  static Future<bool> isAuthenticated() async {
    final prefs = await SharedPreferences.getInstance();
    final session = supabase.auth.currentSession;
    final isAuth = prefs.getBool(_authKey) ?? (session != null);
    if (kDebugMode) {
      debugPrint('Vérification authentification: $isAuth');
    }
    return isAuth;
  }

  static Future<void> login() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_authKey, true);
    if (kDebugMode) {
      debugPrint('Utilisateur connecté avec succès');
    }
  }

  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_authKey, false);
    await supabase.auth.signOut();
    if (kDebugMode) {
      debugPrint('Utilisateur déconnecté avec succès');
    }
  }
}