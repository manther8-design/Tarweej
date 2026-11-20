import 'package:flutter/material.dart';

/// Tarweej brand palette from Mansour’s HTML prototype (royal blue + orange).
abstract final class TarweejColors {
  // Brand royal blue scale
  static const Color blue50 = Color(0xFFEFF6FF);
  static const Color blue100 = Color(0xFFDBEAFE);
  static const Color blue500 = Color(0xFF2563EB);
  static const Color blue600 = Color(0xFF1D4ED8);
  static const Color blue700 = Color(0xFF1E40AF);
  static const Color blue800 = Color(0xFF0F4C81); // Brand Royal Blue
  static const Color blue900 = Color(0xFF0C3A64);

  // Brand vibrant orange
  static const Color orange50 = Color(0xFFFFF7ED);
  static const Color orange100 = Color(0xFFFFEDD5);
  static const Color orange500 = Color(0xFFF97316);
  static const Color orange600 = Color(0xFFEA580C);
  static const Color orange700 = Color(0xFFC2410C);

  // Slate surfaces
  static const Color slate50 = Color(0xFFF8FAFC);
  static const Color slate100 = Color(0xFFF1F5F9);
  static const Color slate200 = Color(0xFFE2E8F0);
  static const Color slate400 = Color(0xFF94A3B8);
  static const Color slate500 = Color(0xFF64748B);
  static const Color slate700 = Color(0xFF334155);
  static const Color slate800 = Color(0xFF1E293B);
  static const Color slate900 = Color(0xFF0F172A);
  static const Color slate950 = Color(0xFF020617);

  // Aliases used across existing widgets
  static const Color ink = blue800;
  static const Color inkSoft = blue700;
  static const Color teal = blue600; // legacy name → brand blue
  static const Color tealDeep = blue800;
  static const Color sandMist = slate100;
  static const Color foam = slate50;
  static const Color coral = orange500;
  static const Color charcoal = slate800;
  static const Color muted = slate500;
  static const Color line = slate200;
  static const Color featured = orange500;
  static const Color featuredSoft = orange100;

  static const Color statusSuccess = Color(0xFF10B981);
  static const Color statusWarning = Color(0xFFF59E0B);
  static const Color statusError = Color(0xFFF43F5E);
  static const Color statusInfo = blue500;
  static const Color statusPending = slate500;
}
