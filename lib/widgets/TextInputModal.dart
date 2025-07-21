import 'package:flutter/material.dart';
import 'package:memovox/widgets/AddItemMenu.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class TextInputModal extends StatelessWidget {
  final String title;
  final String submitLabel;
  final Function(String) onSubmit;
  final ItemType itemType;
  final TextEditingController controller;

  const TextInputModal({
    super.key,
    required this.title,
    required this.submitLabel,
    required this.onSubmit,
    required this.itemType,
    required this.controller,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              title,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 16),
            TextField(
              controller: controller,
              decoration: InputDecoration(
                hintText: 'Saisissez ${itemType.labelWithArticle}',
                border: const OutlineInputBorder(),
              ),
              maxLines: 3,
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: FilledButton(
                    onPressed: () {
                      if (controller.text.isNotEmpty) {
                        onSubmit(controller.text);
                        Navigator.pop(context);
                      }
                    },
                    child: Text(submitLabel),
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