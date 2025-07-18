import 'package:flutter/material.dart';
import 'package:memovox/pages/HomePage.dart';
import 'package:memovox/pages/auth/LoginPage.dart';
import 'package:memovox/pages/auth/RegisterPage.dart';
import 'package:memovox/pages/user/AppointmentPage.dart';
import 'package:memovox/pages/user/TodayPage.dart';
import 'package:memovox/pages/user/ProfilePage.dart';
import 'package:memovox/pages/user/TaskDetailsPage.dart';
import 'package:memovox/pages/user/AppointmentDetailsPage.dart';
import 'package:memovox/pages/user/LateTasksPage.dart';
import 'package:memovox/pages/user/SettingsPage.dart';
import 'package:memovox/pages/user/TasksPage.dart';

final routes = {
  '/': (context) => const LoginPage(),  // Route racine
  '/login': (context) => const LoginPage(),
  '/register': (context) => const RegisterPage(),
  '/home': (context) => const HomePage(),
  '/profile': (context) => const ProfilePage(),
  '/settings': (context) => const SettingsPage(),
  '/dashboard': (context) => const TodayPage(),
  '/tasks': (context) => const TasksPage(),
  '/appointments': (context) => const AppointmentsPage(),
  '/today': (context) => const TodayPage(),
  '/task-details': (context) {
    final args = ModalRoute.of(context)!.settings.arguments as Map<String, dynamic>;
    return TaskDetailsPage(
      task: args['task'],
      onUpdate: args['onUpdate'],
    );
  },
  '/appointment-details': (context) {
    final args = ModalRoute.of(context)!.settings.arguments as Map<String, dynamic>;
    return AppointmentDetailsPage(
      appointment: args['appointment'],
    );
  },
  '/late-tasks': (context) {
    final args = ModalRoute.of(context)!.settings.arguments as Map<String, dynamic>;
    return LateTasksPage(
      tasks: args['tasks'],
    );
  },
};
