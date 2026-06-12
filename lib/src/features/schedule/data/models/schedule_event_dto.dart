import 'dart:ui' show Color;

import '../../domain/entities/schedule_event.dart';

/// Data-layer representation of an event using the raw shapes a source
/// provides: `"HH:mm"` strings and a `"#RRGGBB"` hex color. Parsing/mapping
/// to the domain entity lives here (the original `toMin` / `hexToRgba`
/// conversions), keeping the domain clean. A Google Calendar `fromJson`
/// factory will slot in alongside `toEntity` later.
class ScheduleEventDto {
  const ScheduleEventDto({
    required this.name,
    required this.emoji,
    required this.start,
    required this.end,
    required this.colorHex,
  });

  final String name;
  final String emoji;
  final String start; // "HH:mm"
  final String end; // "HH:mm"
  final String colorHex; // "#RRGGBB"

  static int _toMinutes(String hhmm) {
    final parts = hhmm.split(':');
    return int.parse(parts[0]) * 60 + int.parse(parts[1]);
  }

  static Color _toColor(String hex) {
    final cleaned = hex.replaceFirst('#', '');
    return Color(int.parse('FF$cleaned', radix: 16));
  }

  ScheduleEvent toEntity(String id) => ScheduleEvent(
    id: id,
    name: name,
    emoji: emoji,
    color: _toColor(colorHex),
    startMinute: _toMinutes(start),
    endMinute: _toMinutes(end),
  );
}
