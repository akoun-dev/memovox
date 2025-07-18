import 'package:flutter/material.dart';

class TaskCard extends StatelessWidget {
  final String title;
  final DateTime? dueDate;
  final bool completed;
  final VoidCallback? onTap;
  final VoidCallback? onToggle;

  const TaskCard({
    super.key,
    required this.title,
    this.dueDate,
    this.completed = false,
    this.onTap,
    this.onToggle,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      margin: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ListTile(
        onTap: onTap,
        leading: Checkbox(
          value: completed,
          onChanged: (_) => onToggle?.call(),
        ),
        title: Text(
          title,
          style: TextStyle(
            decoration: completed ? TextDecoration.lineThrough : null,
            color: completed ? Colors.grey : Colors.black,
          ),
        ),
        subtitle: dueDate != null
            ? Text("À faire le ${dueDate!.day}/${dueDate!.month} à ${dueDate!.hour}h${dueDate!.minute.toString().padLeft(2, '0')}")
            : null,
        trailing: const Icon(Icons.chevron_right),
      ),
    );
  }
}
