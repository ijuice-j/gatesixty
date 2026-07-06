import 'dart:ui' show Color;

import 'package:googleapis/calendar/v3.dart' as gcal;

import '../../domain/entities/schedule_event.dart';
import '../../domain/repositories/schedule_repository.dart';
import '../datasources/google_calendar_data_source.dart';

/// [ScheduleRepository] backed by the user's Google Calendar. Maps timed events
/// for today into [ScheduleEvent]s (all-day events are skipped). An event that
/// spans midnight maps to a wrapping `startMinute > endMinute`, which the
/// schedule engine already handles.
class GoogleCalendarScheduleRepository implements ScheduleRepository {
  GoogleCalendarScheduleRepository(this._dataSource);

  final GoogleCalendarDataSource _dataSource;

  @override
  Future<List<ScheduleEvent>> getTodaySchedule() async {
    final raw = await _dataSource.getTodayEvents();
    return mapEventsToToday(raw, DateTime.now());
  }
}

/// Maps Google Calendar events to [ScheduleEvent]s **clipped to the calendar
/// day that contains [now]**.
///
/// The Calendar API returns every event that *overlaps* the day — including one
/// that began the previous evening and runs past midnight into today. Such an
/// event must contribute only the slice that falls today (from 00:00), not its
/// original (e.g. yesterday-22:00) start time. The naive "minute-of-day"
/// mapping dropped the date, so a `22:00 → 02:00` block from yesterday became
/// an indistinguishable wrapping event and re-appeared at 22:00 today.
///
/// Rules (results are minute-of-day, `0..1439`):
/// * Start before today  → clipped to `0` (midnight), so only today's slice shows.
/// * End within today     → its wall-clock minute-of-day (no wrap).
/// * End after today      → its wall-clock minute-of-day lands below the start,
///   i.e. the midnight wrap the engine already handles.
/// * A block ≥ 24h on today's face is capped just shy of a full day so it can't
///   collapse to a zero-length wrap.
///
/// All-day events (no `dateTime`) are skipped.
List<ScheduleEvent> mapEventsToToday(List<gcal.Event> raw, DateTime now) {
  final todayStart = DateTime(now.year, now.month, now.day);
  final todayEnd = todayStart.add(const Duration(days: 1));

  final events = <ScheduleEvent>[];
  for (var i = 0; i < raw.length; i++) {
    final event = raw[i];
    final start = event.start?.dateTime?.toLocal();
    final end = event.end?.dateTime?.toLocal();
    if (start == null || end == null) continue; // skip all-day events

    // Keep only events that genuinely overlap today's window. (`end` is
    // exclusive, so an event ending exactly at 00:00 today doesn't count.)
    if (!end.isAfter(todayStart) || !start.isBefore(todayEnd)) continue;

    // Clip the start to midnight when the block began on an earlier day, so it
    // occupies only its portion that falls today instead of re-showing at its
    // original time.
    final clippedStart = start.isBefore(todayStart) ? todayStart : start;
    final startMinute = clippedStart.hour * 60 + clippedStart.minute;

    // End's minute-of-day. When the event runs into a following day this lands
    // below the start, which the engine reads as a midnight wrap. Cap a block
    // that spans ≥ 24h of today's face just shy of a full day so a multi-day
    // event can't collapse to a zero-length wrap.
    final endMinute = end.difference(clippedStart).inMinutes >= 1440
        ? (startMinute + 1439) % 1440
        : end.hour * 60 + end.minute;

    final name = event.summary?.trim();
    events.add(
      ScheduleEvent(
        id: event.id ?? 'gcal_$i',
        name: (name == null || name.isEmpty) ? '(busy)' : name,
        emoji: '', // gcal has no emoji field; any emoji lives in the title
        color: _eventColor(event.colorId),
        startMinute: startMinute,
        endMinute: endMinute,
        // Snapshot the true (unclipped) planned window for activity tracking —
        // the clipping above only affects the minute-of-day display math.
        plannedStart: start,
        plannedEnd: end,
      ),
    );
  }
  return events;
}

Color _eventColor(String? colorId) =>
    _googleEventColors[colorId] ?? _defaultColor;

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
