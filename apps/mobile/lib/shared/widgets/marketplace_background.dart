import 'package:flutter/material.dart';
import 'package:tarweej_mobile/core/theme/tarweej_colors.dart';

/// Atmospheric wash behind marketplace surfaces (slate + royal blue).
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
                  TarweejColors.slate950,
                  TarweejColors.slate900,
                  Color(0xFF0C3A64),
                ]
              : const <Color>[
                  TarweejColors.slate50,
                  TarweejColors.blue50,
                  Color(0xFFF8FAFC),
                  TarweejColors.slate100,
                ],
          stops: dark
              ? const <double>[0, 0.55, 1]
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
                  color: TarweejColors.blue600.withValues(alpha: dark ? 0.16 : 0.10),
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
                  color: TarweejColors.orange500.withValues(alpha: dark ? 0.10 : 0.06),
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
