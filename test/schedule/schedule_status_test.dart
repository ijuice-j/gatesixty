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
}
