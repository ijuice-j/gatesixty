import 'dart:ui' show Color;

import '../../domain/entities/schedule_event.dart';
import '../../domain/repositories/schedule_repository.dart';
import '../datasources/google_calendar_data_source.dart';

/// [ScheduleRepository] backed by the user's Google Calendar. Maps timed
/// events for today into [ScheduleEvent]s (all-day events are skipped). An
/// event that spans midnight maps to a wrapping `startMinute > endMinute`,
/// which the schedule engine already handles.
class GoogleCalendarScheduleRepository implements ScheduleRepository {
  GoogleCalendarScheduleRepository(this._dataSource);

  final GoogleCalendarDataSource _dataSource;

  @override
  Future<List<ScheduleEvent>> getTodaySchedule() async {
    final raw = await _dataSource.getTodayEvents();
    final events = <ScheduleEvent>[];
    for (var i = 0; i < raw.length; i++) {
      final event = raw[i];
      final start = event.start?.dateTime?.toLocal();
      final end = event.end?.dateTime?.toLocal();
      if (start == null || end == null) continue; // skip all-day events
      final name = event.summary?.trim();
      events.add(
        ScheduleEvent(
          id: event.id ?? 'gcal_$i',
          name: (name == null || name.isEmpty) ? '(busy)' : name,
          emoji: '', // gcal has no emoji field; any emoji lives in the title
          color: _eventColor(event.colorId),
          startMinute: start.hour * 60 + start.minute,
          endMinute: end.hour * 60 + end.minute,
        ),
      );
    }
    return events;
  }

  Color _eventColor(String? colorId) =>
      _googleEventColors[colorId] ?? _defaultColor;
}

const Color _defaultColor = Color(0xFF7B81C9);

/// Google Calendar's standard event-color palette (`colorId` "1".."11").
const Map<String, Color> _googleEventColors = {
  '1': Color(0xFF7986CB), // Lavender
  '2': Color(0xFF33B679), // Sage
  '3': Color(0xFF8E24AA), // Grape
  '4': Color(0xFFE67C73), // Flamingo
  '5': Color(0xFFF6BF26), // Banana
  '6': Color(0xFFF4511E), // Tangerine
  '7': Color(0xFF039BE5), // Peacock
  '8': Color(0xFF616161), // Graphite
  '9': Color(0xFF3F51B5), // Blueberry
  '10': Color(0xFF0B8043), // Basil
  '11': Color(0xFFD50000), // Tomato
};
