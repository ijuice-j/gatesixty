import 'package:flutter_test/flutter_test.dart';
import 'package:googleapis/calendar/v3.dart' as gcal;

import 'package:gate60/src/features/schedule/data/repositories/google_calendar_schedule_repository.dart';

/// Builds a timed event with local start/end.
gcal.Event _event(DateTime start, DateTime end, {String summary = 'X'}) =>
    gcal.Event(
      summary: summary,
      start: gcal.EventDateTime(dateTime: start),
      end: gcal.EventDateTime(dateTime: end),
    );

void main() {
  // "Today" is June 11.
  final now = DateTime(2026, 6, 11, 9, 0);

  group('mapEventsToToday', () {
    test('event that started yesterday and ends today is clipped to midnight',
        () {
      // The reported bug: 10th 22:00 -> 11th 02:00 must NOT show at 22:00 today.
      final events = mapEventsToToday(
        [_event(DateTime(2026, 6, 10, 22, 0), DateTime(2026, 6, 11, 2, 0))],
        now,
      );
      expect(events, hasLength(1));
      expect(events.single.startMinute, 0); // clipped to 00:00, not 22:00
      expect(events.single.endMinute, 120); // 02:00
      expect(events.single.wrapsMidnight, isFalse);
      // The tracking snapshot keeps the TRUE (unclipped) planned window, even
      // though the minute-of-day display was clipped to midnight.
      expect(events.single.plannedStart, DateTime(2026, 6, 10, 22, 0));
      expect(events.single.plannedEnd, DateTime(2026, 6, 11, 2, 0));
    });

    test('event starting tonight that ends tomorrow keeps its midnight wrap',
        () {
      final events = mapEventsToToday(
        [_event(DateTime(2026, 6, 11, 22, 0), DateTime(2026, 6, 12, 2, 0))],
        now,
      );
      expect(events.single.startMinute, 1320); // 22:00
      expect(events.single.endMinute, 120); // 02:00 (next day)
      expect(events.single.wrapsMidnight, isTrue);
    });

    test('plain intra-day event is unchanged', () {
      final events = mapEventsToToday(
        [_event(DateTime(2026, 6, 11, 9, 0), DateTime(2026, 6, 11, 17, 0))],
        now,
      );
      expect(events.single.startMinute, 540); // 09:00
      expect(events.single.endMinute, 1020); // 17:00
      expect(events.single.wrapsMidnight, isFalse);
      expect(events.single.plannedStart, DateTime(2026, 6, 11, 9, 0));
      expect(events.single.plannedEnd, DateTime(2026, 6, 11, 17, 0));
    });

    test('event entirely on a previous day is dropped', () {
      final events = mapEventsToToday(
        [_event(DateTime(2026, 6, 10, 9, 0), DateTime(2026, 6, 10, 17, 0))],
        now,
      );
      expect(events, isEmpty);
    });

    test('multi-day block spanning all of today is capped, not zero-length', () {
      final events = mapEventsToToday(
        [_event(DateTime(2026, 6, 10, 10, 0), DateTime(2026, 6, 12, 10, 0))],
        now,
      );
      expect(events.single.startMinute, 0);
      expect(events.single.durationMinutes, greaterThan(1430)); // ~full day
    });

    test('all-day events (no dateTime) are skipped', () {
      final allDay = gcal.Event(
        summary: 'Holiday',
        start: gcal.EventDateTime(date: DateTime(2026, 6, 11)),
        end: gcal.EventDateTime(date: DateTime(2026, 6, 12)),
      );
      expect(mapEventsToToday([allDay], now), isEmpty);
    });
  });
}
