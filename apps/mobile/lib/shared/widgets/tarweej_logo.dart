import 'package:flutter/material.dart';
import 'package:tarweej_mobile/core/theme/tarweej_colors.dart';

/// Dual-tone ترويج mark from the HTML prototype (blue gradient + orange apex).
class TarweejLogo extends StatelessWidget {
  const TarweejLogo({
    super.key,
    this.height = 36,
    this.showWordmark = true,
    this.onDark = false,
  });

  final double height;
  final bool showWordmark;
  final bool onDark;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: height,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          CustomPaint(
            size: Size(height * 0.95, height * 0.95),
            painter: const _MarkPainter(),
          ),
          if (showWordmark) ...[
            const SizedBox(width: 10),
            Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'ترويج',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        color: onDark ? Colors.white : TarweejColors.blue800,
                        fontWeight: FontWeight.w900,
                        height: 1,
                      ),
                ),
                Text(
                  'TARWEEJ',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: TarweejColors.orange500,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 1.6,
                        height: 1.2,
                      ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

class _MarkPainter extends CustomPainter {
  const _MarkPainter();

  @override
  void paint(Canvas canvas, Size size) {
    final rrect = RRect.fromRectAndRadius(
      Offset.zero & size,
      Radius.circular(size.width * 0.28),
    );
    final fill = Paint()
      ..shader = const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [TarweejColors.blue800, TarweejColors.blue600],
      ).createShader(Offset.zero & size);
    canvas.drawRRect(rrect, fill);

    final stroke = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = size.width * 0.08
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;
    final path = Path()
      ..moveTo(size.width * 0.28, size.height * 0.62)
      ..lineTo(size.width * 0.42, size.height * 0.32)
      ..lineTo(size.width * 0.52, size.height * 0.48)
      ..lineTo(size.width * 0.68, size.height * 0.24);
    canvas.drawPath(path, stroke);
    canvas.drawCircle(
      Offset(size.width * 0.68, size.height * 0.24),
      size.width * 0.06,
      Paint()..color = TarweejColors.orange500,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
