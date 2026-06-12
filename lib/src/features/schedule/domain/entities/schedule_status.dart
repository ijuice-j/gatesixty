import 'schedule_event.dart';

/// A snapshot of "what's happening now" derived from the day's events and the
/// current time. Encapsulates the original `getCurrent` / `getNext` /
/// `remaining` / `progress` engine in one immutable value.
class ScheduleStatus {
  const ScheduleStatus({
    this.current,
    this.next,
    this.previous,
    this.minutesUntilNext = 0,
    this.remainingMinutes = 0,
    this.progress = 0,
    this.freeProgress = 0,
  });

  /// The event happening right now, or `null` when the user is "Free".
  final ScheduleEvent? current;

  /// The soonest upcoming event (by wall-clock), or `null` if none exist.
  final ScheduleEvent? next;

  /// The most recently finished block — the "just ended" event — or `null` when
  /// nothing has ended within the last 12h. Powers the tap-to-reveal PAST pill.
  final ScheduleEvent? previous;

  /// Minutes until [next] starts.
  final double minutesUntilNext;

  /// Minutes until [current] ends (only meaningful when [current] != null).
  final double remainingMinutes;

  /// Completion fraction `0..1` of [current].
  final double progress;

  /// Completion fraction `0..1` of the current *free gap* — how far between the
  /// previous event's end and [next]'s start. Only meaningful when free.
  final double freeProgress;

  bool get isFree => current == null;

  /// True when an event is active now but free time follows it before the next
  /// event starts (the next event isn't back-to-back). Also true when the
  /// active event is the last of the day. `minutesUntilNext == remainingMinutes`
  /// means the next event begins exactly when this one ends (no gap).
  bool get freeFollows =>
      current != null && (next == null || minutesUntilNext > remainingMinutes);

  /// Resolves the status for [nowMinute] (minute-of-day, may be fractional).
  factory ScheduleStatus.resolve(
    List<ScheduleEvent> events,
    double nowMinute,
  ) {
    ScheduleEvent? current;
    for (final event in events) {
      if (event.isActiveAt(nowMinute)) {
        current = event;
        break;
      }
    }

    ScheduleEvent? next;
    var bestDelta = double.infinity;
    for (final event in events) {
      var delta = (event.startMinute - nowMinute + 1440) % 1440;
      if (delta == 0) delta = 1440; // "starting now" counts as a full day away
      if (delta < bestDelta) {
        bestDelta = delta;
        next = event;
      }
    }

    // The most recently ended block ("PAST"). Skip the active event (it hasn't
    // ended yet); ignore anything whose end wraps to more than 12h ago, which
    // would be a far-future block rather than something just finished.
    ScheduleEvent? previous;
    var bestAgo = double.infinity;
    for (final event in events) {
      if (identical(event, current)) continue;
      final ago = (nowMinute - event.endMinute + 1440) % 1440;
      if (ago < bestAgo) {
        bestAgo = ago;
        previous = event;
      }
    }
    if (bestAgo > 720) previous = null;

    // Progress through the current free gap: from the most recently ended
    // event up to the next event's start.
    var freeProgress = 0.0;
    final nextEvent = next;
    if (current == null && nextEvent != null && events.isNotEmpty) {
      var smallestAgo = double.infinity;
      double? gapStart;
      for (final event in events) {
        final ago = (nowMinute - event.endMinute + 1440) % 1440;
        if (ago < smallestAgo) {
          smallestAgo = ago;
          gapStart = event.endMinute.toDouble();
        }
      }
      if (gapStart != null) {
        final total = (nextEvent.startMinute - gapStart + 1440) % 1440;
        // Only meaningful for intra-day gaps. A long/overnight gap — or the
        // lead-in before the day's first event, where the previous event wraps
        // to "yesterday" — reads as empty rather than misleadingly near-full.
        if (total > 0 && total <= 720) {
          freeProgress = (smallestAgo / total).clamp(0.0, 1.0);
        }
      }
    }

    return ScheduleStatus(
      current: current,
      next: next,
      previous: previous,
      minutesUntilNext: next == null ? 0 : bestDelta,
      remainingMinutes: current?.remainingFrom(nowMinute) ?? 0,
      progress: current?.progressAt(nowMinute) ?? 0,
      freeProgress: freeProgress,
    );
  }
}
