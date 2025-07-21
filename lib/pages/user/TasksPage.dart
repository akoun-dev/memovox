// lib/presentation/pages/tasks_page.dart
import 'package:flutter/material.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import 'dart:ui';
import 'package:intl/intl.dart';
import 'package:line_icons/line_icons.dart';
import 'package:memovox/core/layout/AppDrawer.dart';
import 'package:memovox/models/task.dart';
import 'package:memovox/services/task_service.dart';

enum _ViewType { list, grid }
enum _DateFilter { all, today, week, custom }
enum _StatusFilter { all, pending, done }

class TasksPage extends StatefulWidget {
  const TasksPage({super.key});
  @override
  State<TasksPage> createState() => _TasksPageState();
}

class _TasksPageState extends State<TasksPage> with TickerProviderStateMixin {
  final stt.SpeechToText _speech = stt.SpeechToText();
  bool _isListening = false;
  bool _speechAvailable = false;
  final _service = TaskService();
  Future<List<Task>> _future = Future.value([]);

  final _searchController = TextEditingController();
  _ViewType _viewType = _ViewType.list;
  _DateFilter _dateFilter = _DateFilter.all;
  _StatusFilter _statusFilter = _StatusFilter.all;
  String? _projectFilter;
  List<Map<String, dynamic>> _projects = [];

  @override
  void initState() {
    super.initState();
    _refresh();
    _loadProjects();
    _searchController.addListener(() => setState(() {}));
    _initializeSpeech();
  }

  Future<void> _initializeSpeech() async {
    try {
      _speechAvailable = await _speech.initialize(
        onStatus: (status) {
          if (status == 'done' || status == 'notListening') {
            setState(() => _isListening = false);
          }
        },
        onError: (error) {
          setState(() => _isListening = false);
          debugPrint('Erreur de reconnaissance vocale: $error');
        },
      );
    } catch (e) {
      debugPrint('Erreur d\'initialisation vocale: $e');
      _speechAvailable = false;
    }
  }

  Future<void> _startVoiceInput() async {
    if (!_speechAvailable) return;

    if (_isListening) {
      await _speech.stop();
      setState(() => _isListening = false);
      return;
    }

    try {
      setState(() => _isListening = true);
      await _speech.listen(
        onResult: (result) {
          if (result.finalResult) {
            _handleVoiceCommand(result.recognizedWords);
          }
        },
        localeId: 'fr_FR',
      );
    } catch (e) {
      debugPrint('Erreur vocale: $e');
      setState(() => _isListening = false);
    }
  }

  void _handleVoiceCommand(String text) {
    if (text.trim().isEmpty) return;
    
    // Créer la tâche directement depuis le texte vocal
    _service.createTask(
      description: text,
      projectId: null,
      dueDate: null,
    ).then((_) {
      _refresh();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Tâche créée: "$text"'),
          behavior: SnackBarBehavior.floating,
          shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.all(Radius.circular(8)),
          ),
        ),
      );
    }).catchError((e) {
      debugPrint('Erreur création tâche vocale: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Erreur lors de la création de la tâche'),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
          shape: const RoundedRectangleBorder(
            borderRadius: BorderRadius.all(Radius.circular(8)),
          ),
        ),
      );
    });
  }

  Future<void> _loadProjects() async =>
      _projects = await _service.getProjects();

  Future<void> _refresh() async {
    try {
      final tasks = await _service.getTasks(
        from: _dateRangeStart,
        to: _dateRangeEnd,
        projectId: _projectFilter,
        completed: _statusFilter == _StatusFilter.all
            ? null
            : _statusFilter == _StatusFilter.done,
      );
      setState(() => _future = Future.value(tasks));
    } catch (e) {
      setState(() => _future = Future.value([]));
    }
  }

  /* ------------------ Filters ------------------ */
  DateTime? get _dateRangeStart {
    final now = DateTime.now();
    switch (_dateFilter) {
      case _DateFilter.today:
        return DateTime(now.year, now.month, now.day);
      case _DateFilter.week:
        return now.subtract(const Duration(days: 7));
      case _DateFilter.custom:
        return _customStart;
      default:
        return null;
    }
  }

  DateTime? get _dateRangeEnd {
    final now = DateTime.now();
    switch (_dateFilter) {
      case _DateFilter.today:
        return DateTime(now.year, now.month, now.day + 1);
      case _DateFilter.week:
        return now.add(const Duration(days: 1));
      case _DateFilter.custom:
        return _customEnd;
      default:
        return null;
    }
  }

  DateTime? _customStart, _customEnd;

  List<Task> _applyFilters(List<Task> list) {
    final query = _searchController.text.toLowerCase();
    return list.where((t) {
      final matchesSearch = t.description.toLowerCase().contains(query);
      final matchesProject =
          _projectFilter == null || t.projectId == _projectFilter;
      return matchesSearch && matchesProject;
    }).toList();
  }

  /* ------------------ Add Task ------------------ */
  void _showAddSheet() {
    final controller = TextEditingController();
    DateTime? dueDate;
    String? projectId;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => StatefulBuilder(
        builder: (context, setStateModal) => Padding(
          padding: EdgeInsets.only(
              bottom: MediaQuery.of(context).viewInsets.bottom + 20),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const SizedBox(height: 12),
                Text('Ajouter une tâche',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: Theme.of(context).colorScheme.onSurface,
                        )),
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    children: [
                      TextField(
                        controller: controller,
                        decoration: InputDecoration(
                          hintText: 'Ex. Faire les courses',
                          filled: true,
                          fillColor: Theme.of(context)
                              .colorScheme
                              .surfaceVariant
                              .withOpacity(0.3),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide.none,
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      ListTile(
                        title: const Text('Date d’échéance'),
                        subtitle: Text(
                          dueDate == null
                              ? 'Non définie'
                              : DateFormat.yMd('fr').format(dueDate!),
                          style: TextStyle(
                              color: Theme.of(context).colorScheme.onSurface),
                        ),
                        trailing: Container(
                          decoration: BoxDecoration(
                            color: Theme.of(context)
                                .colorScheme
                                .primaryContainer
                                .withOpacity(0.2),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Icon(Icons.calendar_today,
                              color: Theme.of(context).colorScheme.onSurface),
                        ),
                        onTap: () async {
                          final picked = await showDatePicker(
                            context: context,
                            initialDate: dueDate ?? DateTime.now(),
                            firstDate: DateTime.now(),
                            lastDate: DateTime.now().add(const Duration(days: 365)),
                          );
                          if (picked != null) {
                            setStateModal(() => dueDate = picked);
                          }
                        },
                      ),
                      if (_projects.isNotEmpty)
                        DropdownButtonFormField<String?>(
                          value: projectId,
                          decoration: InputDecoration(
                              labelText: 'Projet (optionnel)',
                              filled: true,
                              fillColor: Theme.of(context)
                                  .colorScheme
                                  .surfaceVariant
                                  .withOpacity(0.3),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide.none,
                              )),
                          items: [
                            const DropdownMenuItem(
                                value: null, child: Text('Aucun')),
                            ..._projects.map((p) => DropdownMenuItem(
                                value: p['id'], child: Text(p['name'])))
                          ],
                          onChanged: (v) => projectId = v,
                        ),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: ElevatedButton.icon(
                    icon: const Icon(LineIcons.check),
                    label: const Text('Ajouter'),
                    style: ElevatedButton.styleFrom(
                      minimumSize: const Size(double.infinity, 48),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: () {
                      Navigator.pop(context);
                      _service.createTask(
                        description: controller.text,
                        projectId: projectId,
                        dueDate: dueDate,
                      );
                      _refresh();
                    },
                  ),
                ),
                const SizedBox(height: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }

  /* ------------------ UI ------------------ */
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        title: const Text('Tâches'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        flexibleSpace: ClipRRect(
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
            child: Container(
              color: Theme.of(context).colorScheme.background.withOpacity(0.8),
            ),
          ),
        ),
        actions: [
          IconButton(
            icon: Icon(_viewType == _ViewType.list
                ? LineIcons.adjust
                : LineIcons.list),
            onPressed: () =>
                setState(() => _viewType = _viewType.toggle()),
          ),
          PopupMenuButton<_DateFilter>(
            icon: const Icon(Icons.filter_list),
            onSelected: (v) async {
              if (v == _DateFilter.custom) {
                final range = await showDateRangePicker(
                  context: context,
                  firstDate: DateTime(2000),
                  lastDate: DateTime(2100),
                  builder: (context, child) => Theme(
                    data: Theme.of(context).copyWith(
                      colorScheme: ColorScheme.fromSeed(
                        seedColor: Theme.of(context).colorScheme.primary,
                        brightness: Theme.of(context).brightness,
                      ),
                    ),
                    child: child!,
                  ),
                );
                if (range != null) {
                  _customStart = range.start;
                  _customEnd = range.end;
                }
              }
              _dateFilter = v;
              _refresh();
            },
            itemBuilder: (_) => const [
              PopupMenuItem(
                  value: _DateFilter.today, child: Text('Aujourd’hui')),
              PopupMenuItem(
                  value: _DateFilter.week, child: Text('Cette semaine')),
              PopupMenuItem(value: _DateFilter.all, child: Text('Tout')),
              PopupMenuItem(
                  value: _DateFilter.custom, child: Text('Personnalisé')),
            ],
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(120),
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 12),
            child: Column(
              children: [
                TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'Rechercher…',
                    prefixIcon: const Icon(LineIcons.search),
                    filled: true,
                    fillColor: Theme.of(context)
                        .colorScheme
                        .surfaceVariant
                        .withOpacity(0.3),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: SegmentedButton<_StatusFilter>(
                        segments: const [
                          ButtonSegment(
                              value: _StatusFilter.all, label: Text('Tout')),
                          ButtonSegment(
                              value: _StatusFilter.pending,
                              label: Text('À faire')),
                          ButtonSegment(
                              value: _StatusFilter.done, label: Text('Fait')),
                        ],
                        selected: {_statusFilter},
                        onSelectionChanged: (s) =>
                            setState(() => _statusFilter = s.first),
                      ),
                    ),
                    const SizedBox(width: 8),
                    if (_projects.isNotEmpty)
                      DropdownButton<String?>(
                        value: _projectFilter,
                        hint: const Text('Projet'),
                        underline: const SizedBox(),
                        dropdownColor: Theme.of(context).colorScheme.surfaceVariant,
                        items: [
                          const DropdownMenuItem(
                              value: null, child: Text('Tous')),
                          ..._projects
                              .map((p) => DropdownMenuItem(
                                  value: p['id'], child: Text(p['name'])))
                        ],
                        onChanged: (v) => setState(() => _projectFilter = v),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
      drawer: const AppDrawer(),
      floatingActionButton: Row(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          FloatingActionButton(
            heroTag: 'voice_fab',
            onPressed: _startVoiceInput,
            child: Icon(_isListening ? LineIcons.stop : LineIcons.microphone),
            backgroundColor: _isListening ? Colors.red : null,
            elevation: 4,
            shape: const CircleBorder(),
          ),
          const SizedBox(width: 12),
          FloatingActionButton(
            heroTag: 'add_fab',
            onPressed: _showAddSheet,
            child: const Icon(LineIcons.plus),
            elevation: 4,
            shape: const CircleBorder(),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _refresh,
        color: Theme.of(context).colorScheme.primary,
        child: FutureBuilder<List<Task>>(
          future: _future,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const _SkeletonList();
            }
            final tasks = _applyFilters(snapshot.data ?? []);
            if (tasks.isEmpty) return const _EmptyTasks();
            return _viewType == _ViewType.list
                ? _TaskListView(tasks: tasks, onRefresh: _refresh)
                : _TaskGridView(tasks: tasks, onRefresh: _refresh);
          },
        ),
      ),
    );
  }
}

extension _ViewTypeX on _ViewType {
  _ViewType toggle() => this == _ViewType.list ? _ViewType.grid : _ViewType.list;
}

/* ------------------ WIDGETS ------------------ */
class _TaskListView extends StatelessWidget {
  final List<Task> tasks;
  final VoidCallback onRefresh;
  const _TaskListView({required this.tasks, required this.onRefresh});

  @override
  Widget build(BuildContext context) {
    final groups = _groupByDate(tasks);
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: groups.length,
      itemBuilder: (_, i) {
        final date = groups.keys.elementAt(i);
        final list = groups[date]!;
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.only(bottom: 8, top: 12),
              child: Text(
                date,
                style: Theme.of(context)
                    .textTheme
                    .titleMedium
                    ?.copyWith(fontWeight: FontWeight.bold),
              ),
            ),
            ...list.map((t) => _TaskCard(task: t, onRefresh: onRefresh)),
          ],
        );
      },
    );
  }

  Map<String, List<Task>> _groupByDate(List<Task> tasks) {
    final map = <String, List<Task>>{};
    for (final t in tasks) {
      final key = t.dueDate == null
          ? 'Sans date'
          : DateFormat('EEEE d MMM', 'fr').format(t.dueDate!.toLocal());
      (map[key] ??= []).add(t);
    }
    return map;
  }
}

class _TaskGridView extends StatelessWidget {
  final List<Task> tasks;
  final VoidCallback onRefresh;
  const _TaskGridView({required this.tasks, required this.onRefresh});

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2, mainAxisSpacing: 8, crossAxisSpacing: 8),
      itemCount: tasks.length,
      itemBuilder: (_, i) => _TaskCard(task: tasks[i], onRefresh: onRefresh),
    );
  }
}

class _TaskCard extends StatelessWidget {
  final Task task;
  final VoidCallback onRefresh;
  const _TaskCard({required this.task, required this.onRefresh});

  @override
  Widget build(BuildContext context) {
    final service = TaskService();
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => service.updateTask(task.copyWith(
            isCompleted: !task.isCompleted)).then((_) => onRefresh()),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Checkbox(
                    value: task.isCompleted,
                    onChanged: (_) async {
                      await service.updateTask(
                          task.copyWith(isCompleted: !task.isCompleted));
                      onRefresh();
                    },
                  ),
                  const Spacer(),
                  IconButton(
                    icon: const Icon(LineIcons.trash, color: Colors.red),
                    onPressed: () async {
                      await service.deleteTask(task.id);
                      onRefresh();
                    },
                  ),
                ],
              ),
              Text(
                task.description,
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  decoration: task.isCompleted
                      ? TextDecoration.lineThrough
                      : TextDecoration.none,
                  fontWeight: FontWeight.w500,
                ),
              ),
              if (task.dueDate != null)
                Text(
                  DateFormat('dd/MM').format(task.dueDate!),
                  style: const TextStyle(fontSize: 12, color: Colors.grey),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _EmptyTasks extends StatelessWidget {
  const _EmptyTasks();
  @override
  Widget build(BuildContext context) => Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(LineIcons.clipboard,
                size: 80, color: Colors.grey[400]),
            const SizedBox(height: 16),
            const Text('Aucune tâche', style: TextStyle(fontSize: 16)),
          ],
        ),
      );
}

class _SkeletonList extends StatelessWidget {
  const _SkeletonList();
  @override
  Widget build(BuildContext context) => ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: 6,
        itemBuilder: (_, __) => Container(
          height: 76,
          margin: const EdgeInsets.only(bottom: 8),
          decoration: BoxDecoration(
            color: Colors.grey[200],
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      );
}