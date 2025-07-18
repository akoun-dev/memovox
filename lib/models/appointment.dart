
class Appointment {
  final String id;
  final String userId;
  final String title;
  final String location;
  final DateTime dateTime;

  Appointment({
    required this.id,
    required this.userId,
    required this.title,
    required this.location,
    required this.dateTime,
  });

  factory Appointment.fromJson(Map<String, dynamic> json) {
    return Appointment(
      id: json['id'],
      userId: json['user_id'],
      title: json['title'],
      location: json['location'],
      dateTime: DateTime.parse(json['date_time']),
      createdAt: DateTime.parse(json['created_at']),
      updatedAt: DateTime.parse(json['updated_at']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'title': title,
      'location': location,
      'date_time': dateTime.toIso8601String(),
      'created_at': createdAt.toIso8601String(),
      'updated_at': updatedAt.toIso8601String(),
    };
  }
}
