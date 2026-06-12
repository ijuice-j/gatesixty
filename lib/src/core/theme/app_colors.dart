import 'package:flutter/material.dart';

/// Centralised palette, ported 1:1 from the CSS custom properties of the
/// original flip-clock HTML.
class AppColors {
  AppColors._();

  // Stage
  static const Color background = Color(0xFF000000);

  // Flip card
  static const Color card = Color(0xFF181818);
  static const Color cardTop = Color(0xFF1C1C1C);
  static const Color cardTopEnd = Color(0xFF191919);
  static const Color cardBottomStart = Color(0xFF1A1A1A);
  static const Color cardBottom = Color(0xFF161616);
  static const Color digit = Color(0xFFCCCCCC);
  static const Color hinge = Color(0xFF000000);

  // Tag / chrome
  static const Color tagSurface = Color(0xFF121212);
  static const Color tagBorder = Color(0xFF232323);
  static const Color tagName = Color(0xFFF0F0F0);
  static const Color tagSeparator = Color(0xFF444444);
  static const Color tagRemaining = Color(0xFF9A9A9A);
  static const Color tagRemainingStrong = Color(0xFFD8D8D8);
  static const Color idleDot = Color(0xFF555555);
  static const Color progressIdle = Color(0xFF777777);

  // Next pill
  static const Color nextText = Color(0xFF5A5A5A);
  static const Color nextLabel = Color(0xFF4A4A4A);
  static const Color nextName = Color(0xFF8A8A8A);
  static const Color nextTime = Color(0xFF6A6A6A);

  // Agenda
  static const Color agendaScrim = Color(0xE6000000); // rgba(0,0,0,0.9)
  static const Color agendaTitle = Color(0xFF555555);
  static const Color agendaRow = Color(0xFF777777);
  static const Color agendaRowCurrent = Color(0xFFF0F0F0);
  static const Color agendaDivider = Color(0xFF161616);
}
