import 'package:flutter/material.dart';
import 'package:memovox/core/layout/AppDrawer.dart';

class AppointmentsPage extends StatelessWidget {
  const AppointmentsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
  appBar: AppBar(title: const Text('Rendez-vous')),
  drawer: const AppDrawer(),
  body: const Center(
    child: Text('Page des rendez-vous'),
    ),
    ); 
}
}