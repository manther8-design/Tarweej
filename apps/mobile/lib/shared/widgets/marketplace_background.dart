import 'package:flutter/material.dart';
import 'package:tarweej_mobile/core/theme/tarweej_colors.dart';

/// Atmospheric wash behind marketplace surfaces (not a flat single color).
class MarketplaceBackground extends StatelessWidget {
  const MarketplaceBackground({required this.child, super.key});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: dark
              ? const <Color>[
                  Color(0xFF07131F),
                  TarweejColors.ink,
                  Color(0xFF0E2A2A),
                ]
              : const <Color>[
                  Color(0xFFDCECEE),
                  TarweejColors.sandMist,
                  Color(0xFFF3F8F6),
                  Color(0xFFE4EEF0),
                ],
          stops: dark
              ? const <double>[0, 0.45, 1]
              : const <double>[0, 0.35, 0.7, 1],
        ),
      ),
      child: Stack(
        children: [
          PositionedDirectional(
            top: -80,
            end: -40,
            child: IgnorePointer(
              child: Container(
                width: 220,
                height: 220,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: (dark ? TarweejColors.teal : TarweejColors.teal)
                      .withValues(alpha: dark ? 0.12 : 0.14),
                ),
              ),
            ),
          ),
          PositionedDirectional(
            bottom: 120,
            start: -60,
            child: IgnorePointer(
              child: Container(
                width: 180,
                height: 180,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: TarweejColors.inkSoft.withValues(alpha: dark ? 0.35 : 0.06),
                ),
              ),
            ),
          ),
          Positioned.fill(child: child),
        ],
      ),
    );
  }
}
