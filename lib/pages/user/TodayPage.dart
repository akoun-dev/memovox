// lib/presentation/pages/today_page.dart
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:memovox/core/layout/AppDrawer.dart';
import 'package:memovox/services/notification_service.dart';
import 'package:memovox/widgets/AddItemMenu.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import 'package:supabase_flutter/supabase_flutter.dart';

class TodayPage extends StatefulWidget {
  const TodayPage({super.key});

  @override
  State<TodayPage> createState() => _TodayPageState();
}

class _TodayPageState extends State<TodayPage>
    with SingleTickerProviderStateMixin {
  /* ----------------------------------------------------------
   *  Variables
   * -------------------------------------------------------- */
  final SupabaseClient _supabase = Supabase.instance.client;
  final stt.SpeechToText _speech = stt.SpeechToText();
  late AnimationController _micAnim;

  List<Map<String, dynamic>> _tasks = [];
  List<Map<String, dynamic>> _appointments = [];
  bool _loading = true;
  bool _isListening = false;
  bool _speechAvailable = false;

  /* ----------------------------------------------------------
   *  Life-cycle
   * -------------------------------------------------------- */
  @override
  void initState() {
    super.initState();
    _micAnim = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    _initializeSpeech();
    _loadData();
  }

  @override
  void dispose() {
    _micAnim.dispose();
    _speech.stop();
    super.dispose();
  }

  /* ----------------------------------------------------------
   *  Speech Initialization
   * -------------------------------------------------------- */
  Future<void> _initializeSpeech() async {
    try {
      _speechAvailable = await _speech.initialize(
        onStatus: (status) {
          if (status == 'done' || status == 'notListening') {
            setState(() {
              _isListening = false;
            });
            _micAnim.reverse();
          }
        },
        onError: (error) {
          setState(() {
            _isListening = false;
          });
          _micAnim.reverse();
          _showSnackBar('Erreur de reconnaissance vocale: $error', isError: true);
        },
      );
    } catch (e) {
      debugPrint('Erreur d\'initialisation de la reconnaissance vocale: $e');
      _speechAvailable = false;
    }
  }

  /* ----------------------------------------------------------
   *  Data
   * -------------------------------------------------------- */
  Future<void> _loadData() async {
    try {
      final uid = _supabase.auth.currentUser?.id;
      if (uid == null) {
        setState(() => _loading = false);
        return;
      }

      final now = DateTime.now();
      final today = DateTime(now.year, now.month, now.day);
      final tomorrow = today.add(const Duration(days: 1));
      
      final results = await Future.wait([
        _supabase
            .from('tasks')
            .select()
            .eq('user_id', uid)
            .lt('due_date', tomorrow.toIso8601String())
            .gte('due_date', today.toIso8601String())
            .order('due_date', ascending: true),
        _supabase
            .from('appointments')
            .select()
            .eq('user_id', uid)
            .lt('date_time', tomorrow.toIso8601String())
            .gte('date_time', today.toIso8601String())
            .order('date_time', ascending: true),
      ]);

      if (!mounted) return;
      
      setState(() {
        _tasks = List<Map<String, dynamic>>.from(results[0]);
        _appointments = List<Map<String, dynamic>>.from(results[1]);
        _loading = false;
      });
    } catch (e) {
      debugPrint('Erreur lors du chargement des données: $e');
      setState(() => _loading = false);
      _showSnackBar('Erreur lors du chargement des données', isError: true);
    }
  }

  /* ----------------------------------------------------------
   *  Voice
   * -------------------------------------------------------- */
  Future<void> _startVoiceInput({String? type}) async {
    if (!_speechAvailable) {
      _showSnackBar('Reconnaissance vocale non disponible', isError: true);
      return;
    }

    if (_isListening) {
      await _stopVoiceInput();
      return;
    }

    try {
      setState(() {
        _isListening = true;
      });
      _micAnim.forward();

      await _speech.listen(
        onResult: (result) async {
          if (result.finalResult) {
            await _handleVoiceCommand(result.recognizedWords);
            await _stopVoiceInput();
          }
        },
        listenFor: const Duration(seconds: 30),
        pauseFor: const Duration(seconds: 3),
        localeId: 'fr_FR',
      );
    } on PlatformException catch (e) {
      debugPrint('PlatformException: $e');
      await _stopVoiceInput();
      _showSnackBar('Erreur lors de l\'enregistrement', isError: true);
    } catch (e) {
      debugPrint('Erreur voice input: $e');
      await _stopVoiceInput();
      _showSnackBar('Erreur lors de l\'enregistrement', isError: true);
    }
  }

  Future<void> _stopVoiceInput() async {
    _speech.stop();
    setState(() {
      _isListening = false;
    });
    _micAnim.reverse();
  }

  /* ----------------------------------------------------------
   *  Add Item
   * -------------------------------------------------------- */
  Future<void> _showAddItemMenu() async {
    final result = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (context) => const AddItemMenu(),
    );

    if (result == null) return;

    if (result['method'] == 'voice') {
      await _startVoiceInput(type: result['type']);
    } else {
      await _showTextInputDialog(type: result['type']);
    }
  }

  Future<void> _showTextInputDialog({required String type}) async {
    final titleController = TextEditingController();
    final descriptionController = TextEditingController();

    await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Ajouter ${type == 'task' ? 'une tâche' : 'un rendez-vous'}'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: titleController,
              decoration: const InputDecoration(
                labelText: 'Titre',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: descriptionController,
              decoration: const InputDecoration(
                labelText: 'Description',
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              await _addItem(
                type: type,
                title: titleController.text,
                description: descriptionController.text,
              );
            },
            child: const Text('Ajouter'),
          ),
        ],
      ),
    );
  }

  Future<void> _addItem({
    required String type,
    required String title,
    required String description,
  }) async {
    try {
      final uid = _supabase.auth.currentUser?.id;
      if (uid == null) {
        _showSnackBar('Utilisateur non connecté', isError: true);
        return;
      }

      final now = DateTime.now();
      final data = {
        'user_id': uid,
        'title': title,
        'description': description,
        'created_at': now.toIso8601String(),
        'updated_at': now.toIso8601String(),
      };

      if (type == 'task') {
        await _supabase.from('tasks').insert({
          ...data,
          'is_completed': false,
          'due_date': now.toIso8601String(),
        });
      } else {
        await _supabase.from('appointments').insert({
          ...data,
          'date_time': now.toIso8601String(),
          'location': '',
        });
      }

      await NotificationService.showNotification(
        title: 'Nouvel élément ajouté',
        body: title,
      );
      
      _showSnackBar('${type == 'task' ? 'Tâche' : 'Rendez-vous'} ajouté avec succès');
      await _loadData();
    } catch (e) {
      debugPrint('Erreur lors de l\'ajout: $e');
      _showSnackBar('Erreur lors de l\'ajout', isError: true);
    }
  }

  Future<void> _handleVoiceCommand(String cmd) async {
    if (cmd.trim().isEmpty) return;

    try {
      final uid = _supabase.auth.currentUser?.id;
      if (uid == null) {
        _showSnackBar('Utilisateur non connecté', isError: true);
        return;
      }

      final lower = cmd.toLowerCase();
      final now = DateTime.now();

      if (lower.contains('rendez-vous') || 
          lower.contains('rdv') || 
          lower.contains('réunion') ||
          lower.contains('meeting')) {
        
        // Créer un rendez-vous
        final appointmentData = {
          'user_id': uid,
          'title': cmd,
          'description': cmd,
          'location': '',
          'date_time': now.toIso8601String(),
          'created_at': now.toIso8601String(),
          'updated_at': now.toIso8601String(),
        };

        await _supabase.from('appointments').insert(appointmentData);
        
        await NotificationService.showNotification(
          title: 'Nouveau rendez-vous créé',
          body: cmd,
        );
        
        _showSnackBar('Rendez-vous ajouté avec succès');
      } else {
        // Créer une tâche
        final taskData = {
          'user_id': uid,
          'title': cmd,
          'description': cmd,
          'is_completed': false,
          'due_date': now.toIso8601String(),
          'created_at': now.toIso8601String(),
          'updated_at': now.toIso8601String(),
        };

        await _supabase.from('tasks').insert(taskData);
        
        await NotificationService.showNotification(
          title: 'Nouvelle tâche créée',
          body: cmd,
        );
        
        _showSnackBar('Tâche ajoutée avec succès');
      }

      await _loadData();
    } catch (e) {
      debugPrint('Erreur lors de la création: $e');
      _showSnackBar('Erreur lors de la création', isError: true);
    }
  }

  /* ----------------------------------------------------------
   *  Helpers
   * -------------------------------------------------------- */
  void _showSnackBar(String message, {bool isError = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? Colors.red[600] : Colors.green[600],
        behavior: SnackBarBehavior.floating,
        duration: Duration(seconds: isError ? 4 : 2),
      ),
    );
  }

  int get _pending => _tasks.where((t) => 
      t['is_completed'] != null && !(t['is_completed'] as bool)).length;

  int get _completed => _tasks.where((t) => 
      t['is_completed'] != null && (t['is_completed'] as bool)).length;

  int get _late => _tasks.where((t) {
    if (t['is_completed'] != null && (t['is_completed'] as bool)) return false;
    final dueDateStr = t['due_date'] as String?;
    if (dueDateStr == null || dueDateStr.isEmpty) return false;
    final dueDate = DateTime.tryParse(dueDateStr);
    if (dueDate == null) return false;
    return dueDate.isBefore(DateTime.now());
  }).length;

  int get _todayAppointmentsCount {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    return _appointments.where((a) {
      final dateStr = a['date_time'] as String?;
      if (dateStr == null) return false;
      final date = DateTime.tryParse(dateStr);
      return date != null &&
             date.isAfter(today) &&
             date.isBefore(today.add(const Duration(days: 1)));
    }).length;
  }


  List<Map<String, dynamic>> get _todaySorted {
    final now = DateTime.now();
    final start = DateTime(now.year, now.month, now.day);
    final end = start.add(const Duration(days: 1));

    final items = <Map<String, dynamic>>[];

    // Ajouter les tâches du jour non terminées
    for (final task in _tasks) {
      final isCompleted = task['is_completed'] as bool? ?? false;
      if (isCompleted) continue;
      
      final dueDateStr = task['due_date'] as String?;
      if (dueDateStr == null) continue;
      
      final dueDate = DateTime.tryParse(dueDateStr);
      if (dueDate != null &&
          dueDate.isAfter(start) &&
          dueDate.isBefore(end)) {
        items.add({
          ...task,
          'type': 'task',
          'sort_date': dueDateStr,
        });
      }
    }

    // Ajouter les rendez-vous du jour
    for (final appointment in _appointments) {
      final dateTimeStr = appointment['date_time'] as String?;
      if (dateTimeStr != null && dateTimeStr.isNotEmpty) {
        final dateTime = DateTime.tryParse(dateTimeStr);
        if (dateTime != null &&
            dateTime.isAfter(start) &&
            dateTime.isBefore(end)) {
          items.add({
            ...appointment,
            'type': 'rdv',
            'sort_date': dateTime.toIso8601String(),
          });
        }
      }
    }

    // Trier par heure
    items.sort((a, b) {
      final aDate = a['sort_date'] as String? ?? '';
      final bDate = b['sort_date'] as String? ?? '';
      return aDate.compareTo(bDate);
    });

    debugPrint('Activités aujourd\'hui: ${items.length}');
    return items;
  }

  Map<String, dynamic>? get _nextActivity {
    final now = DateTime.now();
    
    for (final item in _todaySorted) {
      final isCompleted = item['is_completed'] as bool? ?? false;
      if (isCompleted) continue;
      
      final sortDateStr = item['sort_date'] as String?;
      if (sortDateStr == null) continue;
      
      final sortDate = DateTime.tryParse(sortDateStr);
      if (sortDate != null && sortDate.isAfter(now)) {
        return item;
      }
    }
    
    return null;
  }

  /* ----------------------------------------------------------
   *  UI
   * -------------------------------------------------------- */
  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();

    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FA),
      drawer: const AppDrawer(),
      appBar: AppBar(
        title: Text(
          DateFormat('EEEE d MMM', 'fr').format(now),
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        centerTitle: true,
        elevation: 0,
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        actions: [
          IconButton(
            icon: Badge(
              isLabelVisible: _late > 0,
              label: Text('$_late'),
              child: const Icon(Icons.notifications_outlined),
            ),
            onPressed: () {
              // TODO: Naviguer vers la page des tâches en retard
            },
          ),
        ],
      ),
      floatingActionButton: ScaleTransition(
        scale: Tween(begin: 1.0, end: 1.15).animate(
          CurvedAnimation(parent: _micAnim, curve: Curves.easeOut),
        ),
        child: FloatingActionButton.extended(
          onPressed: _showAddItemMenu,
          icon: Icon(_isListening ? Icons.stop : Icons.add_rounded),
          label: Text(_isListening ? 'Arrêter' : 'Ajouter'),
          backgroundColor: _isListening
              ? Colors.red
              : Theme.of(context).colorScheme.primary,
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator.adaptive())
          : RefreshIndicator(
              onRefresh: _loadData,
              child: ListView(
                padding: const EdgeInsets.only(bottom: 100),
                children: [
                  _HeaderSection(
                    next: _nextActivity,
                    lateCount: _late,
                    pendingCount: _pending,
                    completedCount: _completed,
                    todayAppointmentsCount: _todayAppointmentsCount,
                  ),
                  if (_todaySorted.isEmpty)
                    const _EmptyToday()
                  else
                    ..._todaySorted.map((item) => _ActivityCard(
                          item: item,
                          onToggle: _loadData,
                          supabase: _supabase,
                        )),
                ],
              ),
            ),
    );
  }
}

/* ============================================================
 *  WIDGETS EXTRAITS
 * ============================================================ */

class _HeaderSection extends StatelessWidget {
  final Map<String, dynamic>? next;
  final int lateCount;
  final int pendingCount;
  final int completedCount;
  final int todayAppointmentsCount;

  const _HeaderSection({
    this.next,
    required this.lateCount,
    required this.pendingCount,
    required this.completedCount,
    required this.todayAppointmentsCount,
  });

  @override
  Widget build(BuildContext context) {
    final hour = DateTime.now().hour;
    final greeting = hour < 12
        ? 'Bonjour ☀️'
        : hour < 18
            ? 'Bon après-midi 🌤️'
            : 'Bonsoir 🌙';

    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            greeting,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Voici ton résumé du jour',
            style: Theme.of(context).textTheme.bodyLarge,
          ),
          const SizedBox(height: 20),
          
          // Statistiques rapides
          Row(
            children: [
              Expanded(
                child: _StatCard(
                  title: 'À faire',
                  count: pendingCount,
                  color: Colors.orange,
                  icon: Icons.pending_actions,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _StatCard(
                  title: 'Terminées',
                  count: completedCount,
                  color: Colors.green,
                  icon: Icons.check_circle,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _StatCard(
                  title: 'Rendez-vous',
                  count: todayAppointmentsCount,
                  color: Colors.blue,
                  icon: Icons.event,
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 16),
          
          // Prochaine activité
          if (next != null) _NextCard(next: next!),
          
          // Bannière de retard
          if (lateCount > 0) ...[
            const SizedBox(height: 12),
            _LateBanner(count: lateCount),
          ],
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final int count;
  final Color color;
  final IconData icon;

  const _StatCard({
    required this.title,
    required this.count,
    required this.color,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 8),
          Text(
            '$count',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          Text(
            title,
            style: TextStyle(
              color: Colors.grey[600],
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
}

class _NextCard extends StatelessWidget {
  final Map<String, dynamic> next;
  const _NextCard({required this.next});

  @override
  Widget build(BuildContext context) {
    final sortDateStr = next['sort_date'] as String?;
    if (sortDateStr == null) return const SizedBox.shrink();

    final dt = DateTime.tryParse(sortDateStr);
    if (dt == null) return const SizedBox.shrink();

    final diff = dt.difference(DateTime.now());
    final subtitle = diff.inMinutes < 60
        ? 'Dans ${diff.inMinutes} min'
        : 'À ${DateFormat('HH:mm').format(dt)}';

    final title = next['title'] as String? ?? 
                  next['description'] as String? ?? 
                  'Sans titre';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Theme.of(context).colorScheme.primary,
            Theme.of(context).colorScheme.primaryContainer,
          ],
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Icon(
            next['type'] == 'rdv' ? Icons.event : Icons.task_alt,
            color: Colors.white,
            size: 24,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Prochaine activité',
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _LateBanner extends StatelessWidget {
  final int count;
  const _LateBanner({required this.count});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.red.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.red.shade200),
      ),
      child: Row(
        children: [
          Icon(Icons.warning_amber_rounded, color: Colors.red.shade600),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              '$count tâche${count > 1 ? 's' : ''} en retard',
              style: TextStyle(
                color: Colors.red.shade700,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          TextButton(
            onPressed: () {
              // TODO: Naviguer vers la liste des tâches en retard
            },
            child: Text(
              'Voir',
              style: TextStyle(color: Colors.red.shade700),
            ),
          ),
        ],
      ),
    );
  }
}

class _ActivityCard extends StatelessWidget {
  final Map<String, dynamic> item;
  final VoidCallback onToggle;
  final SupabaseClient supabase;

  const _ActivityCard({
    required this.item,
    required this.onToggle,
    required this.supabase,
  });

  @override
  Widget build(BuildContext context) {
    final sortDateStr = item['sort_date'] as String?;
    if (sortDateStr == null) return const SizedBox.shrink();

    final dt = DateTime.tryParse(sortDateStr);
    if (dt == null) return const SizedBox.shrink();

    final isPast = dt.isBefore(DateTime.now());
    final isTask = item['type'] == 'task';
    final done = item['is_completed'] as bool? ?? false;
    final title = item['title'] as String? ?? 
                  item['description'] as String? ?? 
                  'Sans titre';

    return Container(
      margin: const EdgeInsets.fromLTRB(20, 0, 20, 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ListTile(
        leading: Icon(
          isTask ? Icons.check_circle : Icons.event,
          color: isTask
              ? (done ? Colors.green : Colors.orange)
              : Theme.of(context).colorScheme.primary,
        ),
        title: Text(
          title,
          style: TextStyle(
            decoration: done ? TextDecoration.lineThrough : null,
            color: isPast && !done ? Colors.red : null,
          ),
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
        subtitle: Text(DateFormat('HH:mm').format(dt)),
        trailing: isTask
            ? Checkbox(
                value: done,
                onChanged: (_) => _toggleTask(),
              )
            : null,
        onTap: () {
          // TODO: Naviguer vers les détails
          debugPrint('Tapped on ${isTask ? 'task' : 'appointment'}: $title');
        },
      ),
    );
  }

  Future<void> _toggleTask() async {
    try {
      final taskId = item['id'];
      final currentStatus = item['is_completed'] as bool? ?? false;
      
      await supabase
          .from('tasks')
          .update({
            'is_completed': !currentStatus,
            'updated_at': DateTime.now().toIso8601String(),
          })
          .eq('id', taskId);
          
      onToggle();
    } catch (e) {
      debugPrint('Erreur lors de la mise à jour de la tâche: $e');
    }
  }
}

class _EmptyToday extends StatelessWidget {
  const _EmptyToday();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(40),
      child: Column(
        children: [
          Icon(
            Icons.calendar_today, 
            size: 72, 
            color: Colors.grey[400],
          ),
          const SizedBox(height: 16),
          Text(
            'Rien de prévu aujourd\'hui',
            style: TextStyle(
              color: Colors.grey[600],
              fontSize: 18,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Profitez de cette journée libre !',
            style: TextStyle(
              color: Colors.grey[500],
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }
}
