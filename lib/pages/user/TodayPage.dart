import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:memovox/core/layout/AppDrawer.dart';
import 'package:memovox/widgets/AppointmentTile.dart';
import 'package:memovox/widgets/TaskCard.dart';
import 'package:memovox/widgets/progress_line_painter.dart';

class TodayPage extends StatelessWidget {
  const TodayPage({super.key});

  /* ------------------ Données fictives ------------------ */
  static const todayTasks = [
    {
      'description': 'Appeler le docteur',
      'date': Duration(hours: 2),
      'is_completed': false,
      'created_at': '2025-07-17',
      'updated_at': '2025-07-18T09:00:00',
      'project_id': 'proj_medecin',
    },
    {
      'description': 'Envoyer rapport client',
      'date': Duration(hours: 4),
      'is_completed': true,
      'created_at': '2025-07-15',
      'updated_at': '2025-07-18T10:00:00',
      'project_id': 'proj_travail',
    },
    {
      'description': 'Acheter cadeau',
      'date': Duration(hours: -1),
      'is_completed': false,
      'created_at': '2025-07-16',
      'updated_at': '2025-07-18T11:00:00',
      'project_id': null,
    },
  ];

  static const todayAppointments = [
    {
      'title': 'Réunion MemoVox',
      'location': 'Zoom',
      'date': Duration(hours: 3),
    },
    {
      'title': 'Dentiste',
      'location': 'Clinique',
      'date': Duration(hours: 6),
    },
  ];

  /* ------------------------------------------------------ */
  List<Map<String, dynamic>> get _todaySorted {
    final now = DateTime.now();
    final items = <Map<String, dynamic>>[
      ...todayTasks.map((t) => {
        ...t,
        'type': 'task',
        'dateTime': now.add(t['date'] as Duration),
        'description': t['description'],
        'project_id': t['project_id'],
        'created_at': t['created_at'],
        'updated_at': t['updated_at'],
      }),
      ...todayAppointments.map((r) => {
        ...r,
        'type': 'rdv',
        'dateTime': now.add(r['date'] as Duration),
      }),
    ];
    items.sort((a, b) => (a['dateTime'] as DateTime).compareTo(b['dateTime'] as DateTime));
    return items;
  }

  int get _pending => todayTasks.where((t) => !(t['is_completed'] as bool)).length;
  int get _completed => todayTasks.length - _pending;
  int get _late => todayTasks.where((t) => !(t['is_completed'] as bool) && (t['date'] as Duration).inMinutes < 0).length;
  int get _rdvCount => todayAppointments.length;

  /* ------------------------------------------------------ */
  @override
  Widget build(BuildContext context) {
    final now = DateTime.now();
    final next = _todaySorted.isEmpty
        ? null
        : _todaySorted.firstWhere(
            (e) => (e['dateTime'] as DateTime).isAfter(now),
            orElse: () => <String, dynamic>{},
          );

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        title: Text(
          DateFormat('EEEE d MMMM', 'fr').format(now),
          style: const TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 18,
          ),
        ),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black87,
        elevation: 0,
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () {},
          ),
        ],
      ),
      drawer: const AppDrawer(),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {/* TODO: saisie vocale */},
        icon: const Icon(Icons.mic),
        label: const Text('Parler'),
        backgroundColor: Colors.indigo,
        foregroundColor: Colors.white,
      ),
      body: RefreshIndicator(
        onRefresh: () async {},
        child: CustomScrollView(
          slivers: [
            // Header avec salutation
            SliverToBoxAdapter(
              child: Container(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _WelcomeHeader(),
                    const SizedBox(height: 24),
                    _QuickStatsGrid(
                      pending: _pending,
                      completed: _completed,
                      rdv: _rdvCount,
                      late: _late,
                    ),
                  ],
                ),
              ),
            ),
            
            // Prochaine activité importante
            if (next != null && next.isNotEmpty)
              SliverToBoxAdapter(
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 20),
                  child: _NextItemHighlight(item: next),
                ),
              ),
            
            // Alertes en retard
            if (_late > 0)
              SliverToBoxAdapter(
                child: Container(
                  margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  child: _LateBanner(count: _late),
                ),
              ),
            
            // Section Timeline
            SliverToBoxAdapter(
              child: Container(
                margin: const EdgeInsets.only(top: 24),
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(
                  children: [
                    const Icon(Icons.schedule, size: 20, color: Colors.indigo),
                    const SizedBox(width: 8),
                    Text(
                      'Planning du jour',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: Colors.indigo,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            
            // Timeline des activités
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              sliver: _TodayTimelineSliver(items: _todaySorted),
            ),
            
            // Progression hebdo
            SliverToBoxAdapter(
              child: Container(
                margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                child: _ProgressSection(),
              ),
            ),
            
            // Espacement en bas pour le FAB
            const SliverToBoxAdapter(
              child: SizedBox(height: 80),
            ),
          ],
        ),
      ),
    );
  }
}

/* ============================================================
 *  WIDGETS AMÉLIORÉS
 * ============================================================ */

class _WelcomeHeader extends StatelessWidget {
  const _WelcomeHeader();
  @override
  Widget build(BuildContext context) {
    final hour = DateTime.now().hour;
    String greeting;

    
    if (hour < 12) {
      greeting = 'Bonjour';
    } else if (hour < 17) {
      greeting = 'Bon après-midi';
    } else {
      greeting = 'Bonsoir';
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 4),
        Text(
          'Voici ton résumé du jour',
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
            fontWeight: FontWeight.w700,
            color: Colors.black87,
          ),
        ),
      ],
    );
  }
}

class _QuickStatsGrid extends StatelessWidget {
  final int pending, completed, rdv, late;
  const _QuickStatsGrid({
    required this.pending,
    required this.completed,
    required this.rdv,
    required this.late,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 20,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: _StatItem(
                  icon: Icons.pending_actions,
                  value: pending,
                  label: 'À faire',
                  color: Colors.orange,
                  backgroundColor: Colors.orange.shade50,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _StatItem(
                  icon: Icons.check_circle,
                  value: completed,
                  label: 'Terminé',
                  color: Colors.green,
                  backgroundColor: Colors.green.shade50,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _StatItem(
                  icon: Icons.event,
                  value: rdv,
                  label: 'RDV',
                  color: Colors.blue,
                  backgroundColor: Colors.blue.shade50,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _StatItem(
                  icon: Icons.warning,
                  value: late,
                  label: 'En retard',
                  color: Colors.red,
                  backgroundColor: Colors.red.shade50,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _StatItem extends StatelessWidget {
  final IconData icon;
  final int value;
  final String label;
  final Color color;
  final Color backgroundColor;

  const _StatItem({
    required this.icon,
    required this.value,
    required this.label,
    required this.color,
    required this.backgroundColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 8),
          Text(
            '$value',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[600],
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}

class _NextItemHighlight extends StatelessWidget {
  final Map<String, dynamic> item;
  const _NextItemHighlight({required this.item});

  @override
  Widget build(BuildContext context) {
    if (item.isEmpty) return const SizedBox.shrink();
    
    final time = DateFormat('HH:mm').format(item['dateTime'] as DateTime);
    final duration = (item['dateTime'] as DateTime).difference(DateTime.now());
    final inMinutes = duration.inMinutes;
    
    String timeText;
    if (inMinutes < 60) {
      timeText = 'Dans $inMinutes min';
    } else {
      timeText = 'À $time';
    }

    final title = item['title'] ?? item['description'] ?? '';
    final location = item['location'] ?? '';

    return Container(
      margin: const EdgeInsets.only(top: 16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.indigo.shade600, Colors.indigo.shade400],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.indigo.withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.2),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                item['type'] == 'rdv' ? Icons.event : Icons.task_alt,
                color: Colors.white,
                size: 24,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Prochaine activité',
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.8),
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    title,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  if (item['location'] != null)
                    Text(
                      location,
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.8),
                        fontSize: 12,
                      ),
                    ),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  timeText,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  time,
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.8),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ],
        ),
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
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.red.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.red.shade200),
      ),
      child: Row(
        children: [
          Icon(Icons.warning_amber_rounded, color: Colors.red.shade600),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              '$count tâche(s) en retard',
              style: TextStyle(
                color: Colors.red.shade700,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          TextButton(
            onPressed: () {
              Navigator.pushNamed(
                context,
                '/late-tasks',
                arguments: {
                  'tasks': TodayPage.todayTasks.where((t) =>
                    !(t['is_completed'] as bool) &&
                    (DateTime.now().add(t['date'] as Duration)).isBefore(DateTime.now())
                  ).toList(),
                },
              );
            },
            child: Text(
              'Voir',
              style: TextStyle(color: Colors.red.shade600),
            ),
          ),
        ],
      ),
    );
  }
}

class _TodayTimelineSliver extends StatefulWidget {
  final List<Map<String, dynamic>> items;
  const _TodayTimelineSliver({required this.items});

  @override
  State<_TodayTimelineSliver> createState() => _TodayTimelineSliverState();
}

class _TodayTimelineSliverState extends State<_TodayTimelineSliver> {
  late List<Map<String, dynamic>> _items;

  @override
  void initState() {
    super.initState();
    _items = widget.items;
  }

  @override
  Widget build(BuildContext context) {
    if (_items.isEmpty) {
      return SliverFillRemaining(
        hasScrollBody: false,
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.calendar_today,
                size: 64,
                color: Colors.grey[400],
              ),
              const SizedBox(height: 16),
              Text(
                'Aucune activité aujourd\'hui',
                style: TextStyle(
                  color: Colors.grey[600],
                  fontSize: 16,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return SliverList(
      delegate: SliverChildBuilderDelegate(
        (context, index) {
          final item = _items[index];
          final isPast = (item['dateTime'] as DateTime).isBefore(DateTime.now());
          final isNext = !isPast && (index == 0 || (_items[index - 1]['dateTime'] as DateTime).isBefore(DateTime.now()));

          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: isNext ? Border.all(color: Colors.indigo.shade200, width: 2) : null,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: item['type'] == 'task'
                ? TaskCard(
                    title: item['description'],
                    dueDate: item['dateTime'],
                    completed: item['is_completed'],
                    onToggle: () {
                      setState(() {
                        final taskIndex = _items.indexWhere(
                          (t) => t['id'] == item['id']
                        );
                        if (taskIndex != -1) {
                          _items[taskIndex]['is_completed'] = !_items[taskIndex]['is_completed'];
                        }
                      });
                      // TODO: Implémenter la mise à jour dans Supabase
                    },
                    onTap: () {
                      Navigator.pushNamed(
                        context,
                        '/task-details',
                        arguments: {
                          'task': item,
                          'onUpdate': () => setState(() {}),
                        },
                      );
                    },
                  )
                : AppointmentTile(
                    title: item['title'],
                    location: item['location'],
                    dateTime: item['dateTime'],
                    onTap: () {
                      Navigator.pushNamed(
                        context,
                        '/appointment-details',
                        arguments: {
                          'appointment': item,
                        },
                      );
                    },
                  ),
          );
        },
        childCount: _items.length,
      ),
    );
  }
}

class _ProgressSection extends StatelessWidget {
  const _ProgressSection();
  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 20,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.trending_up, color: Colors.green, size: 20),
              const SizedBox(width: 8),
              Text(
                'Progression de la semaine',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 80,
            child: CustomPaint(
              painter: ProgressLinePainter(progress: 0.75),
              size: Size.infinite,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '75% des objectifs atteints',
                style: TextStyle(
                  color: Colors.grey[600],
                  fontWeight: FontWeight.w500,
                ),
              ),
              Text(
                '15/20 tâches',
                style: TextStyle(
                  color: Colors.green.shade600,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}