import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../../core/utils/color_utils.dart';
import '../../../schedule/domain/entities/schedule_event.dart';
import '../../../schedule/presentation/providers/schedule_providers.dart';
import '../../data/repositories/supabase_tracking_repository.dart';
import '../../domain/entities/activity_outcome.dart';
import '../../domain/repositories/tracking_repository.dart';

part 'tracking_providers.g.dart';

/// The tracking backend. Supabase-backed; swap here if it ever changes.
@Riverpod(keepAlive: true)
TrackingRepository trackingRepository(Ref ref) =>
    SupabaseTrackingRepository(Supabase.instance.client);

/// Holds the live "I'm doing / did this" intent per event, and freezes an
/// outcome into the ledger the moment an event ends.
///
/// Flow: the clock button toggles intent for the *current* event (keyed by its
/// stable Google Calendar instance id). When that event ends it becomes
/// [ScheduleStatus.previous]; this controller catches the transition and — only
/// if the intent was set — records a `done` row. Untouched events are never
/// written, so an absent row reads as "not done".
///
/// `state` is the set of event ids currently marked done, so the button can
/// reflect it live.
@Riverpod(keepAlive: true)
class TrackingController extends _$TrackingController {
  /// Occurrences already committed this session — guards against a re-commit
  /// when a 10-minute refresh yields fresh event instances for the same id.
  final Set<String> _committed = <String>{};

  @override
  Set<String> build() {
    ref.listen(
      scheduleStatusProvider.select((s) => s.previous),
      (_, ended) => _onEnded(ended),
    );
    return <String>{};
  }

  /// Flip the done-intent for [event] (expected to be the active one).
  void toggle(ScheduleEvent event) {
    final next = <String>{...state};
    if (!next.remove(event.id)) next.add(event.id);
    state = next;
  }

  bool isMarked(ScheduleEvent event) => state.contains(event.id);

  void _onEnded(ScheduleEvent? ended) {
    if (ended == null) return;
    if (!state.contains(ended.id)) return; // no done-intent → record nothing
    if (!_committed.add(ended.id)) return; // already committed this session
    final outcome = _outcomeOf(ended);
    state = <String>{...state}..remove(ended.id);
    unawaited(_commit(outcome));
  }

  Future<void> _commit(ActivityOutcome outcome) async {
    try {
      await ref.read(trackingRepositoryProvider).recordOutcome(outcome);
    } catch (_) {
      // Best-effort: a failed write leaves no row, which reads as "not done".
      // The (future) web dashboard is the correction path.
    }
  }

  ActivityOutcome _outcomeOf(ScheduleEvent e) {
    final now = DateTime.now();
    final start = e.plannedStart ?? now;
    return ActivityOutcome(
      gcalEventId: e.id,
      occurredOn: DateTime(start.year, start.month, start.day),
      title: e.name,
      plannedStart: e.plannedStart,
      plannedEnd: e.plannedEnd,
      color: hexFromColor(e.color),
      done: true,
      endedAt: now,
    );
  }
}
