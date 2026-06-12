// Pure time-formatting helpers, ported from the original `fmtClock` /
// `fmtDuration` / `pad` JavaScript functions. No Flutter dependency so they
// stay trivially unit-testable.

/// Zero-pads an integer to two digits (`5` -> `"05"`).
String twoDigits(int n) => n.toString().padLeft(2, '0');

/// Formats a minute-of-day (`0..1439`, safely wrapped) into a clock label.
String formatClock(int minuteOfDay, {required bool use24Hour}) {
  final min = ((minuteOfDay % 1440) + 1440) % 1440;
  var h = min ~/ 60;
  final m = min % 60;
  if (use24Hour) return '${twoDigits(h)}:${twoDigits(m)}';
  final meridiem = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h == 0) h = 12;
  return '$h:${twoDigits(m)} $meridiem';
}

/// Human-friendly duration, e.g. `"<1 min"`, `"45 min"`, `"2 hr"`,
/// `"2 hr 5 min"`. Rounds up like the original (`Math.ceil`).
String formatDuration(double minutes) {
  final mins = minutes.ceil();
  if (mins < 1) return '<1 min';
  if (mins < 60) return '$mins min';
  final h = mins ~/ 60;
  final m = mins % 60;
  return m == 0 ? '$h hr' : '$h hr $m min';
}
