import '../entities/schedule_event.dart';

/// Source of the day's routine. The domain is agnostic about *where* events
/// come from — today it's a hardcoded local source; in phase 2 a
/// `GoogleCalendarScheduleRepository` will implement this same interface and
/// the rest of the app won't change.
abstract interface class ScheduleRepository {
  Future<List<ScheduleEvent>> getTodaySchedule();
}
