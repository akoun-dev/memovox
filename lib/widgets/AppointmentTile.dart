import 'package:flutter/material.dart';

class AppointmentTile extends StatelessWidget {
  final String title;
  final String location;
  final DateTime dateTime;
  final VoidCallback? onTap;

  const AppointmentTile({
    super.key,
    required this.title,
    required this.location,
    required this.dateTime,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      leading: const Icon(Icons.event_note, color: Colors.indigo),
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
      subtitle: Text(
        "${dateTime.day}/${dateTime.month} à ${dateTime.hour}h${dateTime.minute.toString().padLeft(2, '0')} • $location",
        style: const TextStyle(color: Colors.black54),
      ),
      trailing: const Icon(Icons.chevron_right),
    );
  }
}
