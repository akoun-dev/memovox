// models/task.dart
class Task {
  Task({
    required this.id,
    required this.userId,
    this.projectId,
    required this.description,
    this.dueDate,
    this.isCompleted = false,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String userId;
  final String? projectId;
  final String description;
  final DateTime? dueDate;
  final bool isCompleted;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Task copyWith({bool? isCompleted, DateTime? dueDate}) => Task(
        id: id,
        userId: userId,
        projectId: projectId,
        description: description,
        dueDate: dueDate ?? this.dueDate,
        isCompleted: isCompleted ?? this.isCompleted,
        createdAt: createdAt,
        updatedAt: updatedAt,
      );
}