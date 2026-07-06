import 'dart:ui' show Color;

/// A single routine block in the day, expressed in minutes-of-day so the
/// wrap-around-midnight math is trivial (e.g. 22:30 -> 01:30).
///
/// This is the domain entity — framework-free apart from `dart:ui`'s [Color].
/// Time/activeness logic lives here as pure methods (rich domain model),
/// ported from the original schedule engine.
class ScheduleEvent {
  const ScheduleEvent({
    required this.id,
    required this.name,
    required this.emoji,
    required this.color,
    required this.startMinute,
    required this.endMinute,
    this.plannedStart,
    this.plannedEnd,
  });

  final String id;
  final String name;
  final String emoji;
  final Color color;

  /// The event's real wall-clock start/end (local), when known. Carried
  /// alongside the minute-of-day fields so activity tracking can snapshot the
  /// true planned window — including the actual date — into its ledger. Null
  /// for sources that only have a time-of-day (e.g. the legacy local routine).
  final DateTime? plannedStart;
  final DateTime? plannedEnd;

  /// Minute-of-day in `0..1439`.
  final int startMinute;

  /// Minute-of-day in `0..1439`. When `<= startMinute` the event wraps past
  /// midnight.
  final int endMinute;

  /// Display label: `"emoji name"`, or just `name` when there's no emoji
  /// (e.g. Google Calendar events that don't start with one).
  String get label => emoji.isEmpty ? name : '$emoji $name';

  bool get wrapsMidnight => endMinute <= startMinute;

  int get durationMinutes => (endMinute - startMinute + 1440) % 1440;

  /// Whether [nowMinute] (may carry a fractional seconds component) falls
  /// inside this event.
  bool isActiveAt(double nowMinute) {
    if (wrapsMidnight) return nowMinute >= startMinute || nowMinute < endMinute;
    return nowMinute >= startMinute && nowMinute < endMinute;
  }

  /// Minutes remaining until this event ends, from [nowMinute].
  double remainingFrom(double nowMinute) =>
      (endMinute - nowMinute + 1440) % 1440;

  /// Completion fraction `0..1` of this event at [nowMinute].
  double progressAt(double nowMinute) {
    final dur = durationMinutes;
    if (dur == 0) return 0;
    final elapsed = (nowMinute - startMinute + 1440) % 1440;
    return (elapsed / dur).clamp(0.0, 1.0);
  }
}
