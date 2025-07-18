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
      id: json['id'] as String,
      userId: json['user_id'] as String,
      title: json['title'] as String,
      location: json['location'] as String,
      dateTime: DateTime.parse(json['date_time'] as String),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'user_id': userId,
        'title': title,
        'location': location,
        'date_time': dateTime.toIso8601String(),
      };
}
