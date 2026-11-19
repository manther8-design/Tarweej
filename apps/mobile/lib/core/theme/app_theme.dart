import 'package:flutter/material.dart';

class AppTheme {
  static ThemeData light() {
    const seed = Color(0xFF1F4B99);
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(seedColor: seed, brightness: Brightness.light),
      fontFamily: 'Roboto',
    );
  }

  static ThemeData dark() {
    const seed = Color(0xFF7BA3FF);
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(seedColor: seed, brightness: Brightness.dark),
      fontFamily: 'Roboto',
    );
  }
}
