import 'package:gate60/src/core/utils/time_formatting.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('formatClock', () {
    test('12-hour afternoon', () {
      expect(formatClock(15 * 60 + 5, use24Hour: false), '3:05 PM');
    });
    test('24-hour afternoon', () {
      expect(formatClock(15 * 60 + 5, use24Hour: true), '15:05');
    });
    test('midnight in 12-hour is 12 AM', () {
      expect(formatClock(0, use24Hour: false), '12:00 AM');
    });
    test('noon in 12-hour is 12 PM', () {
      expect(formatClock(12 * 60, use24Hour: false), '12:00 PM');
    });
    test('wraps negative / overflow minute-of-day safely', () {
      expect(formatClock(-60, use24Hour: true), '23:00');
      expect(formatClock(1440, use24Hour: true), '00:00');
    });
  });

  group('formatDuration', () {
    // Faithful to the original: ceil() is applied first, so only <= 0 is
    // "<1 min"; a fractional value like 0.4 rounds up to "1 min".
    test('zero or less is "<1 min"', () => expect(formatDuration(0), '<1 min'));
    test('fraction rounds up to 1 min', () => expect(formatDuration(0.4), '1 min'));
    test('minutes', () => expect(formatDuration(45), '45 min'));
    test('whole hours', () => expect(formatDuration(120), '2 hr'));
    test('hours and minutes', () => expect(formatDuration(125), '2 hr 5 min'));
    test('rounds up', () => expect(formatDuration(44.2), '45 min'));
  });
}
