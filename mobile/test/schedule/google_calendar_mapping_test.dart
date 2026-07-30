import 'package:flutter_test/flutter_test.dart';
import 'package:googleapis/calendar/v3.dart' as gcal;

import 'package:gate60/src/features/schedule/data/repositories/google_calendar_schedule_repository.dart';
import 'package:gate60/src/features/schedule/domain/entities/schedule_status.dart';

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

  group('mapEventsToFace', () {
    test('event that started yesterday and ends today is clipped to midnight',
        () {
      // The reported bug: 10th 22:00 -> 11th 02:00 must NOT show at 22:00 today.
      final events = mapEventsToFace(
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
      final events = mapEventsToFace(
        [_event(DateTime(2026, 6, 11, 22, 0), DateTime(2026, 6, 12, 2, 0))],
        now,
      );
      expect(events.single.startMinute, 1320); // 22:00
      expect(events.single.endMinute, 120); // 02:00 (next day)
      expect(events.single.wrapsMidnight, isTrue);
    });

    test('plain intra-day event is unchanged', () {
      final events = mapEventsToFace(
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
      final events = mapEventsToFace(
        [_event(DateTime(2026, 6, 10, 9, 0), DateTime(2026, 6, 10, 17, 0))],
        now,
      );
      expect(events, isEmpty);
    });

    test('multi-day block spanning all of today is capped, not zero-length', () {
      final events = mapEventsToFace(
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
      expect(mapEventsToFace([allDay], now), isEmpty);
    });
  });

  group("tomorrow's pre-dawn blocks reach the dial", () {
    // The reported bug, exactly: Wednesday's last block ends 23:00, the next
    // real block is Thursday 00:30. Free time must run 90 minutes to THAT, not
    // 12 hours back round to today's own 11:00.
    final lateEvening = DateTime(2026, 6, 11, 23, 0);

    final todayFirst = _event(
      DateTime(2026, 6, 11, 11, 0),
      DateTime(2026, 6, 11, 12, 0),
      summary: 'Morning',
    );
    final todayLast = _event(
      DateTime(2026, 6, 11, 21, 0),
      DateTime(2026, 6, 11, 23, 0),
      summary: 'Evening',
    );
    final tomorrowEarly = _event(
      DateTime(2026, 6, 12, 0, 30),
      DateTime(2026, 6, 12, 2, 0),
      summary: 'After midnight',
    );

    test("tomorrow's 00:30 block lands on the dial at minute 30", () {
      final events = mapEventsToFace(
        [todayFirst, todayLast, tomorrowEarly],
        lateEvening,
      );
      final after = events.where((e) => e.name == 'After midnight');
      expect(after, hasLength(1), reason: 'must be admitted to the dial');
      expect(after.single.startMinute, 30);
      expect(after.single.endMinute, 120);
      // The true date survives for tracking, even though the dial is date-free.
      expect(after.single.plannedStart, DateTime(2026, 6, 12, 0, 30));
    });

    test('and it is what "next" resolves to — not the 12h wrap round', () {
      final events = mapEventsToFace(
        [todayFirst, todayLast, tomorrowEarly],
        lateEvening,
      );
      // 23:00, the evening block having just ended.
      final status = ScheduleStatus.resolve(events, 23 * 60);
      expect(status.next?.name, 'After midnight');
      expect(status.minutesUntilNext, 90);
    });

    test("a block LATER tomorrow is dropped — it is over a dial-turn away", () {
      // 11:00 tomorrow is 36h out. On a 24h dial it would read as 12h and claim
      // to be today's morning block all over again.
      final tomorrowLate = _event(
        DateTime(2026, 6, 12, 11, 0),
        DateTime(2026, 6, 12, 12, 0),
        summary: 'Tomorrow morning',
      );
      final events = mapEventsToFace(
        [todayFirst, todayLast, tomorrowLate],
        lateEvening,
      );
      expect(events.map((e) => e.name), isNot(contains('Tomorrow morning')));
    });

    test('with nothing today, now is the bound instead of a first block', () {
      // 23:00, empty day: tomorrow 00:30 is 90 minutes out and belongs.
      final events = mapEventsToFace([tomorrowEarly], lateEvening);
      expect(events, hasLength(1));
      expect(events.single.startMinute, 30);

      // Same empty day seen at 09:00: that block is now 15.5h out, still under a
      // dial-turn, so it stays and the dial reads it correctly.
      final morning = mapEventsToFace([tomorrowEarly], DateTime(2026, 6, 11, 9));
      expect(morning, hasLength(1));
      expect(
        ScheduleStatus.resolve(morning, 9 * 60).minutesUntilNext,
        15 * 60 + 30,
      );
    });

    test("today's own blocks are untouched by the second pass", () {
      final events = mapEventsToFace(
        [todayFirst, todayLast, tomorrowEarly],
        lateEvening,
      );
      expect(events.where((e) => e.name == 'Morning'), hasLength(1));
      expect(events.where((e) => e.name == 'Evening'), hasLength(1));
      expect(events, hasLength(3));
    });
  });
}
