import 'dart:ui';

import 'package:gate60/src/features/schedule/domain/entities/schedule_event.dart';
import 'package:gate60/src/features/schedule/domain/entities/schedule_status.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  // 01:30 -> 02:30
  const reading = ScheduleEvent(
    id: 'reading',
    name: 'Reading',
    emoji: '📕',
    color: Color(0xFF7B81C9),
    startMinute: 90,
    endMinute: 150,
  );
  // 22:30 -> 01:30 (wraps past midnight)
  const night = ScheduleEvent(
    id: 'night',
    name: 'Night',
    emoji: '🎮',
    color: Color(0xFF4E9466),
    startMinute: 1350,
    endMinute: 90,
  );

  group('ScheduleEvent', () {
    test('non-wrapping active inside window', () {
      expect(reading.isActiveAt(120), isTrue);
      expect(reading.isActiveAt(89), isFalse);
      expect(reading.isActiveAt(150), isFalse); // end is exclusive
    });

    test('wrapping event active before and after midnight', () {
      expect(night.wrapsMidnight, isTrue);
      expect(night.isActiveAt(1400), isTrue); // 23:20
      expect(night.isActiveAt(30), isTrue); // 00:30
      expect(night.isActiveAt(200), isFalse); // 03:20
    });

    test('durationMinutes handles wrap', () {
      expect(reading.durationMinutes, 60);
      expect(night.durationMinutes, 180); // 22:30 -> 01:30 = 3h
    });

    test('progress is clamped 0..1', () {
      expect(reading.progressAt(90), 0.0);
      expect(reading.progressAt(120), closeTo(0.5, 1e-9));
    });

    test('remaining respects wrap', () {
      expect(night.remainingFrom(1410), closeTo(120, 1e-9)); // 23:30 -> 90 min
    });
  });

  group('ScheduleStatus.resolve', () {
    test('picks the active event as current', () {
      final status = ScheduleStatus.resolve([reading, night], 120);
      expect(status.current?.id, 'reading');
      expect(status.isFree, isFalse);
    });

    test('free gap reports the soonest next event', () {
      final status = ScheduleStatus.resolve([reading, night], 200); // 03:20
      expect(status.current, isNull);
      expect(status.next?.id, 'night'); // 22:30 is the next start
      expect(status.minutesUntilNext, closeTo(1350 - 200, 1e-9));
    });

    test('empty schedule is free with no next', () {
      final status = ScheduleStatus.resolve(const [], 600);
      expect(status.isFree, isTrue);
      expect(status.next, isNull);
    });
  });

  group('ScheduleStatus.resolve previous (PAST block)', () {
    // 09:00–10:00 and 20:00–21:00, both one-off (non-wrapping) today.
    const morning = ScheduleEvent(
      id: 'morning',
      name: 'Morning',
      emoji: '🌅',
      color: Color(0xFFCC9900),
      startMinute: 540,
      endMinute: 600,
    );
    const evening = ScheduleEvent(
      id: 'evening',
      name: 'Evening',
      emoji: '🌙',
      color: Color(0xFF334488),
      startMinute: 1200,
      endMinute: 1260,
    );

    test('no PAST before the first event — a future block is not "past"', () {
      // 07:00: nothing has ended; the 20:00 block must not wrap in as "past".
      final status = ScheduleStatus.resolve([morning, evening], 420);
      expect(status.previous, isNull);
    });

    test('picks the most recently ended block', () {
      // 11:00: the morning block ended at 10:00.
      final status = ScheduleStatus.resolve([morning, evening], 660);
      expect(status.previous?.id, 'morning');
    });

    test('stale blocks (>12h ago) are not shown as past', () {
      // 23:00: morning ended 13h ago — too stale to be "what just finished".
      final status = ScheduleStatus.resolve([morning], 1380);
      expect(status.previous, isNull);
    });

    test('the active block is never its own past', () {
      // 09:30: morning is active; nothing else has ended.
      final status = ScheduleStatus.resolve([morning, evening], 570);
      expect(status.current?.id, 'morning');
      expect(status.previous, isNull);
    });
  });
}
