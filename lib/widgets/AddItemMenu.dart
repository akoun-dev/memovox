// lib/presentation/widgets/add_item_menu.dart
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:ui';

// Enum pour les types d'éléments
enum ItemType {
  task('task', 'Tâche', 'la tâche', Icons.check_circle, Colors.indigoAccent),
  appointment('rdv', 'Rdv', 'le rendez-vous', Icons.calendar_today, Colors.orangeAccent);

  const ItemType(this.id, this.label, this.labelWithArticle, this.icon, this.color);
  final String id;
  final String label;
  final String labelWithArticle;
  final IconData icon;
  final Color color;
}

// Enum pour les méthodes d'ajout
enum AddMethod {
  text('text', 'Saisie texte', Icons.keyboard),
  voice('voice', 'Saisie vocale', Icons.mic);
  // camera('camera', 'Scanner', Icons.camera_alt);

  const AddMethod(this.id, this.label, this.icon);
  final String id;
  final String label;
  final IconData icon;
}

class AddItemMenu extends StatefulWidget {
  final void Function(String type, String method)? onItemSelected;
  
  const AddItemMenu({
    super.key,
    this.onItemSelected,
  });

  @override
  State<AddItemMenu> createState() => _AddItemMenuState();
}

class _AddItemMenuState extends State<AddItemMenu> 
    with SingleTickerProviderStateMixin {
  late final AnimationController _animationController;
  late final Animation<double> _fadeAnimation;
  late final Animation<Offset> _slideAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 250),
      vsync: this,
    );
    
    _fadeAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeOut),
    );
    
    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.1),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeOut),
    );
    
    _animationController.forward();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  void _showMethodSheet(BuildContext context, ItemType type) {
    HapticFeedback.lightImpact();
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => MethodSheet(
        type: type,
        onMethodSelected: (method) {
          widget.onItemSelected?.call(type.id, method.id);
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return AnimatedBuilder(
      animation: _animationController,
      builder: (context, _) {
        return SlideTransition(
          position: _slideAnimation,
          child: FadeTransition(
            opacity: _fadeAnimation,
            child: Material(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
              child: Container(
                constraints: BoxConstraints(
                  maxHeight: MediaQuery.of(context).size.height * 0.8,
                ),
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
                decoration: BoxDecoration(
                  color: theme.colorScheme.surface,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.15),
                      blurRadius: 24,
                      offset: const Offset(0, -4),
                    ),
                  ],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _buildHandle(theme),
                    const SizedBox(height: 20),
                    _buildTitle(theme),
                    const SizedBox(height: 24),
                    _buildItemGrid(context),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildHandle(ThemeData theme) {
    return Center(
      child: Container(
        width: 48,
        height: 4,
        decoration: BoxDecoration(
          color: theme.dividerColor,
          borderRadius: BorderRadius.circular(2),
        ),
      ),
    );
  }

  Widget _buildTitle(ThemeData theme) {
    return Column(
      children: [
        Icon(
          Icons.add,
          size: 32,
          color: theme.colorScheme.primary,
        ),
        const SizedBox(height: 12),
        Text(
          'Que souhaitez-vous ajouter ?',
          textAlign: TextAlign.center,
          style: theme.textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  Widget _buildItemGrid(BuildContext context) {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      mainAxisSpacing: 16,
      crossAxisSpacing: 16,
      childAspectRatio: 1,
      children: ItemType.values.map((type) {
        return AnimatedTypeButton(
          type: type,
          onTap: () => _showMethodSheet(context, type),
        );
      }).toList(),
    );
  }

  Widget _buildQuickActions(BuildContext context, ThemeData theme) {
    return Column(
      children: [
        Divider(height: 1, color: theme.dividerColor),
        const SizedBox(height: 20),
        Row(
          children: [
            Expanded(
              child: TextButton.icon(
                onPressed: () {
                  widget.onItemSelected?.call('task', 'quick');
                },
                icon: const Icon(Icons.add_circle_outline),
                label: const Text('Ajout rapide'),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Annuler'),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class MethodSheet extends StatelessWidget {
  final ItemType type;
  final void Function(AddMethod)? onMethodSelected;

  const MethodSheet({
    super.key,
    required this.type,
    this.onMethodSelected,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Container(
      decoration: BoxDecoration(
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        color: theme.colorScheme.surface,
      ),
      padding: const EdgeInsets.all(24),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildHeader(theme),
            const SizedBox(height: 24),
            ..._buildMethodButtons(context),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(ThemeData theme) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: type.color.withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(type.icon, size: 28, color: type.color),
        ),
        const SizedBox(height: 16),
        Text(
          'Comment ajouter ${type.labelWithArticle} ?',
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  List<Widget> _buildMethodButtons(BuildContext context) {
    return AddMethod.values.map((method) {
      return Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: _MethodButton(
          method: method,
          onTap: () {
            HapticFeedback.selectionClick();
            Navigator.pop(context);
            onMethodSelected?.call(method);
          },
        ),
      );
    }).toList();
  }
}

class AnimatedTypeButton extends StatefulWidget {
  final ItemType type;
  final VoidCallback onTap;

  const AnimatedTypeButton({
    super.key,
    required this.type,
    required this.onTap,
  });

  @override
  State<AnimatedTypeButton> createState() => _AnimatedTypeButtonState();
}

class _AnimatedTypeButtonState extends State<AnimatedTypeButton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 100),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: widget.onTap,
      onTapDown: (_) => _controller.forward(),
      onTapUp: (_) => _controller.reverse(),
      onTapCancel: () => _controller.reverse(),
      child: ScaleTransition(
        scale: Tween(begin: 1.0, end: 0.95).animate(_controller),
        child: Container(
          decoration: BoxDecoration(
            color: widget.type.color,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: widget.type.color.withOpacity(0.3),
                blurRadius: 8,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(widget.type.icon, size: 36, color: Colors.white),
              const SizedBox(height: 12),
              Text(
                widget.type.label,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                  fontSize: 16,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MethodButton extends StatelessWidget {
  final AddMethod method;
  final VoidCallback onTap;

  const _MethodButton({
    required this.method,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Material(
      borderRadius: BorderRadius.circular(12),
      color: theme.colorScheme.surfaceVariant,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: theme.colorScheme.primary.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(method.icon, color: theme.colorScheme.primary),
              ),
              const SizedBox(width: 16),
              Text(
                method.label,
                style: theme.textTheme.bodyLarge,
              ),
              const Spacer(),
              Icon(Icons.chevron_right, color: theme.colorScheme.onSurfaceVariant),
            ],
          ),
        ),
      ),
    );
  }
}