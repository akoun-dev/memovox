import 'package:flutter/material.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import 'package:memovox/core/layout/AppDrawer.dart';
import 'package:memovox/models/appointment.dart';
import 'package:memovox/services/appointment_service.dart';
import 'package:memovox/services/notification_service.dart';
import 'package:memovox/widgets/AppointmentTile.dart';

class AppointmentsPage extends StatefulWidget {
  const AppointmentsPage({super.key});

  @override
  State<AppointmentsPage> createState() => _AppointmentsPageState();
}

class _AppointmentsPageState extends State<AppointmentsPage> {
  final AppointmentService _service = AppointmentService();
  final stt.SpeechToText _speech = stt.SpeechToText();

  List<Appointment> _list = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final data = await _service.getAppointments();
    setState(() {
      _list = data;
      _loading = false;
    });
  }

  Future<void> _add(String title, String location, DateTime time) async {
    final app = await _service.createAppointment(
      title: title,
      location: location,
      dateTime: time,
    );
    setState(() => _list.add(app));
    await NotificationService.showNotification(
      title: 'Nouveau rendez-vous',
      body: title,
    );
  }

  void _showAddDialog() {
    final titleCtrl = TextEditingController();
    final locCtrl = TextEditingController();
    DateTime date = DateTime.now();
    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setStateSB) => AlertDialog(
          title: const Text('Nouveau rendez-vous'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: titleCtrl,
                decoration: const InputDecoration(hintText: 'Titre'),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: locCtrl,
                decoration: const InputDecoration(hintText: 'Lieu'),
              ),
              const SizedBox(height: 8),
              TextButton(
                onPressed: () async {
                  final picked = await showDatePicker(
                    context: context,
                    initialDate: date,
                    firstDate: DateTime.now().subtract(const Duration(days: 1)),
                    lastDate: DateTime.now().add(const Duration(days: 365)),
                  );
                  if (picked != null) {
                    final timeOfDay = await showTimePicker(
                      context: context,
                      initialTime: TimeOfDay.fromDateTime(date),
                    );
                    if (timeOfDay != null) {
                      setStateSB(() {
                        date = DateTime(picked.year, picked.month, picked.day,
                            timeOfDay.hour, timeOfDay.minute);
                      });
                    }
                  }
                },
                child: Text(
                  'Choisir la date : ${date.day}/${date.month}/${date.year} ${date.hour}h${date.minute.toString().padLeft(2, '0')}',
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Annuler'),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                _add(titleCtrl.text, locCtrl.text, date);
              },
              child: const Text('Ajouter'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _startVoice() async {
    if (!await _speech.initialize()) return;
    await _speech.listen(onResult: (res) async {
      if (res.finalResult) {
        final text = res.recognizedWords;
        await _speech.stop();
        await _add(text, '', DateTime.now());
      }
    });
  }

  Future<void> _delete(Appointment app) async {
    await _service.deleteAppointment(app.id);
    setState(() => _list.removeWhere((a) => a.id == app.id));
  }

  void _showOptions(Appointment app) {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.delete),
              title: const Text('Supprimer'),
              onTap: () {
                Navigator.pop(context);
                _delete(app);
              },
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Rendez-vous'),
        backgroundColor: Colors.indigo,
        actions: [
          IconButton(
            icon: const Icon(Icons.mic),
            onPressed: _startVoice,
          ),
        ],
      ),
      drawer: const AppDrawer(),
      floatingActionButton: FloatingActionButton(
        onPressed: _showAddDialog,
        child: const Icon(Icons.add),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(8),
              children: [
                for (final a in _list)
                  AppointmentTile(
                    title: a.title,
                    location: a.location,
                    dateTime: a.dateTime,
                    onTap: () => _showOptions(a),
                  ),
              ],
            ),
    );
  }
}
