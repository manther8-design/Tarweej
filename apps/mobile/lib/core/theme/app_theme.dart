import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:tarweej_mobile/core/theme/tarweej_colors.dart';

class AppTheme {
  static const Color _orange400 = Color(0xFFFB923C);

  static TextTheme _textTheme(Brightness brightness) {
    final base = brightness == Brightness.light
        ? TarweejColors.slate800
        : TarweejColors.slate100;
    final muted = brightness == Brightness.light
        ? TarweejColors.slate500
        : TarweejColors.slate400;

    final display = GoogleFonts.cairoTextTheme();
    final body = GoogleFonts.cairoTextTheme();

    return body.copyWith(
      displayLarge: display.displayLarge?.copyWith(
        color: base,
        fontWeight: FontWeight.w800,
        letterSpacing: -0.5,
      ),
      displayMedium: display.displayMedium?.copyWith(
        color: base,
        fontWeight: FontWeight.w800,
      ),
      displaySmall: display.displaySmall?.copyWith(
        color: base,
        fontWeight: FontWeight.w800,
      ),
      headlineLarge: display.headlineLarge?.copyWith(
        color: base,
        fontWeight: FontWeight.w800,
      ),
      headlineMedium: display.headlineMedium?.copyWith(
        color: base,
        fontWeight: FontWeight.w700,
      ),
      headlineSmall: display.headlineSmall?.copyWith(
        color: base,
        fontWeight: FontWeight.w700,
      ),
      titleLarge: display.titleLarge?.copyWith(
        color: base,
        fontWeight: FontWeight.w700,
      ),
      titleMedium: body.titleMedium?.copyWith(
        color: base,
        fontWeight: FontWeight.w600,
      ),
      titleSmall: body.titleSmall?.copyWith(
        color: base,
        fontWeight: FontWeight.w600,
      ),
      bodyLarge: body.bodyLarge?.copyWith(color: base, height: 1.45),
      bodyMedium: body.bodyMedium?.copyWith(color: muted, height: 1.45),
      bodySmall: body.bodySmall?.copyWith(color: muted, height: 1.4),
      labelLarge: body.labelLarge?.copyWith(
        color: base,
        fontWeight: FontWeight.w600,
      ),
    );
  }

  static ThemeData light() {
    final scheme = ColorScheme.fromSeed(
      seedColor: TarweejColors.blue800,
      brightness: Brightness.light,
      primary: TarweejColors.blue800,
      secondary: TarweejColors.orange500,
      tertiary: TarweejColors.orange600,
      surface: Colors.white,
    );

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: scheme,
      scaffoldBackgroundColor: TarweejColors.slate50,
      textTheme: _textTheme(Brightness.light),
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.white.withValues(alpha: 0.95),
        foregroundColor: TarweejColors.slate800,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleTextStyle: GoogleFonts.cairo(
          fontSize: 22,
          fontWeight: FontWeight.w800,
          color: TarweejColors.blue800,
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: Colors.white,
        indicatorColor: TarweejColors.orange500.withValues(alpha: 0.14),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          final selected = states.contains(WidgetState.selected);
          return GoogleFonts.cairo(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: selected ? TarweejColors.orange500 : TarweejColors.slate500,
          );
        }),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          final selected = states.contains(WidgetState.selected);
          return IconThemeData(
            color: selected ? TarweejColors.orange500 : TarweejColors.slate500,
          );
        }),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: Colors.white,
        selectedColor: TarweejColors.blue800,
        side: const BorderSide(color: TarweejColors.slate200),
        labelStyle: GoogleFonts.cairo(
          fontWeight: FontWeight.w600,
          color: TarweejColors.slate700,
        ),
        secondaryLabelStyle: GoogleFonts.cairo(
          fontWeight: FontWeight.w700,
          color: Colors.white,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: TarweejColors.orange500,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          textStyle: GoogleFonts.cairo(fontWeight: FontWeight.w700),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: TarweejColors.blue800,
          side: const BorderSide(color: TarweejColors.slate200),
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: TarweejColors.slate100,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: TarweejColors.blue800, width: 1.6),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      dividerColor: TarweejColors.slate200,
      cardColor: Colors.white,
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: TarweejColors.orange500,
        foregroundColor: Colors.white,
      ),
    );
  }

  static ThemeData dark() {
    final scheme = ColorScheme.fromSeed(
      seedColor: TarweejColors.blue600,
      brightness: Brightness.dark,
      primary: TarweejColors.blue600,
      secondary: TarweejColors.orange500,
      tertiary: _orange400,
      surface: TarweejColors.slate800,
    );

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: scheme,
      scaffoldBackgroundColor: TarweejColors.slate900,
      textTheme: _textTheme(Brightness.dark),
      appBarTheme: AppBarTheme(
        backgroundColor: TarweejColors.slate900.withValues(alpha: 0.95),
        foregroundColor: TarweejColors.slate100,
        elevation: 0,
        scrolledUnderElevation: 0,
        titleTextStyle: GoogleFonts.cairo(
          fontSize: 22,
          fontWeight: FontWeight.w800,
          color: Colors.white,
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: TarweejColors.slate900,
        indicatorColor: TarweejColors.orange500.withValues(alpha: 0.18),
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          final selected = states.contains(WidgetState.selected);
          return GoogleFonts.cairo(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: selected ? TarweejColors.orange500 : TarweejColors.slate400,
          );
        }),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          final selected = states.contains(WidgetState.selected);
          return IconThemeData(
            color: selected ? TarweejColors.orange500 : TarweejColors.slate400,
          );
        }),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: TarweejColors.orange500,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: TarweejColors.slate800,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: TarweejColors.blue500, width: 1.6),
        ),
      ),
      floatingActionButtonTheme: const FloatingActionButtonThemeData(
        backgroundColor: TarweejColors.orange500,
        foregroundColor: Colors.white,
      ),
    );
  }
}
