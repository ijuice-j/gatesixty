import '../entities/activity_outcome.dart';

/// Persists finished-event outcomes. Backed by Supabase in the app; abstracted
/// so nothing in the domain/presentation layers depends on the backend.
abstract interface class TrackingRepository {
  /// Records (upserts) a finished event's [outcome] into the ledger.
  Future<void> recordOutcome(ActivityOutcome outcome);
}
