import 'package:flutter/material.dart';

class ProgressLinePainter extends CustomPainter {
  final double progress;
  
  ProgressLinePainter({required this.progress});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.indigo
      ..strokeWidth = 8
      ..style = PaintingStyle.stroke;
      
    final path = Path()
      ..moveTo(0, size.height / 2)
      ..lineTo(size.width * progress, size.height / 2);
      
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(CustomPainter oldDelegate) => false;
}