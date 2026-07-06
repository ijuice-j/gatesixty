import 'package:supabase_flutter/supabase_flutter.dart';

import '../../domain/entities/activity_outcome.dart';
import '../../domain/repositories/tracking_repository.dart';

/// [TrackingRepository] backed by the `activity_logs` table.
///
/// `user_id` is filled server-side from `auth.uid()` (the column default) and
/// enforced by RLS, so it's never sent from the client. Writes upsert on the
/// `(user_id, gcal_event_id, occurred_on)` unique key, making a re-commit of
/// the same occurrence idempotent.
class SupabaseTrackingRepository implements TrackingRepository {
  SupabaseTrackingRepository(this._client);

  final SupabaseClient _client;

  @override
  Future<void> recordOutcome(ActivityOutcome o) async {
    await _client.from('activity_logs').upsert(
      {
        'gcal_event_id': o.gcalEventId,
        'occurred_on': _dateOnly(o.occurredOn),
        'title': o.title,
        'planned_start': o.plannedStart?.toUtc().toIso8601String(),
        'planned_end': o.plannedEnd?.toUtc().toIso8601String(),
        'color': o.color,
        'done': o.done,
        'ended_at': o.endedAt.toUtc().toIso8601String(),
      },
      onConflict: 'user_id,gcal_event_id,occurred_on',
    );
  }

  String _dateOnly(DateTime d) =>
      '${d.year.toString().padLeft(4, '0')}-'
      '${d.month.toString().padLeft(2, '0')}-'
      '${d.day.toString().padLeft(2, '0')}';
}
