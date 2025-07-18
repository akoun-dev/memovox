import 'package:flutter/material.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:memovox/routes.dart';
import 'package:memovox/services/auth_service.dart';
import 'package:memovox/services/notification_service.dart';
import 'package:memovox/services/theme_provider.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Supabase.initialize(
    url: 'https://wpynyucbwlukoovmpddm.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndweW55dWNid2x1a29vdm1wZGRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NzU1MzIsImV4cCI6MjA2ODE1MTUzMn0.jqQGAOEZQxL3ZGOKLI8voPQMB-N52Xwh1R_eylkbhGA',
  );

  final isAuthenticated = await AuthService.isAuthenticated();
  await initializeDateFormatting();
  await NotificationService.init();

  final themeProvider = ThemeProvider();
  await themeProvider.load();

  runApp(
    ChangeNotifierProvider.value(
      value: themeProvider,
      child: Memovox(initialRoute: isAuthenticated ? '/today' : '/'),
    ),
  );
}

// It's handy to then extract the Supabase client in a variable for later uses
final supabase = Supabase.instance.client;

class Memovox extends StatelessWidget {
  final String initialRoute;

  const Memovox({super.key, required this.initialRoute});

  @override
  Widget build(BuildContext context) {
    return Consumer<ThemeProvider>(
      builder: (context, theme, _) => MaterialApp(
        title: 'MemoVox',
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
          brightness: Brightness.light,
        ),
        darkTheme: ThemeData(
          colorScheme: ColorScheme.fromSeed(
            seedColor: Colors.deepPurple,
            brightness: Brightness.dark,
          ),
          brightness: Brightness.dark,
        ),
        themeMode: theme.mode,
        initialRoute: initialRoute,
        routes: routes,
      ),
    );
  }
}
