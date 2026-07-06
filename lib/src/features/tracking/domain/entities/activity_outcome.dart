/// An immutable snapshot of a finished event's outcome, ready to be written to
/// the tracking ledger.
///
/// It snapshots the event's details (title, planned window, colour) rather than
/// referencing the live calendar event, so a recorded outcome stays stable even
/// if the source Google Calendar event is later edited or deleted.
class ActivityOutcome {
  const ActivityOutcome({
    required this.gcalEventId,
    required this.occurredOn,
    required this.title,
    required this.done,
    required this.endedAt,
    this.plannedStart,
    this.plannedEnd,
    this.color,
  });

  /// Stable Google Calendar instance id — the occurrence anchor.
  final String gcalEventId;

  /// The calendar day this occurrence belongs to (time-of-day is ignored).
  final DateTime occurredOn;

  /// Snapshot of the event title at freeze time.
  final String title;

  /// Snapshot of the true planned window (local wall-clock), when known.
  final DateTime? plannedStart;
  final DateTime? plannedEnd;

  /// Snapshot of the accent colour as `#RRGGBB`, when known.
  final String? color;

  /// Whether the event was done. v1 only ever records `true`; an absent row is
  /// what "not done" looks like.
  final bool done;

  /// When the event ended / the outcome was frozen.
  final DateTime endedAt;
}
