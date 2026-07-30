import 'package:googleapis/calendar/v3.dart' as gcal;

import '../../../auth/data/google_auth_service.dart';

/// Fetches events from the user's primary Google Calendar for today **and
/// tomorrow**.
class GoogleCalendarDataSource {
  GoogleCalendarDataSource(this._authService);

  final GoogleAuthService _authService;

  /// Today's events plus tomorrow's.
  ///
  /// Tomorrow is fetched because the clock face wraps at midnight: at 23:00 with
  /// nothing left today, "what's next" is tomorrow's first block, and a
  /// today-only window cannot see it. The mapper decides which of tomorrow's
  /// events actually belong on the face — see `mapEventsToFace`.
  Future<List<gcal.Event>> getEventsThroughTomorrow() async {
    final client = _authService.authorizedClient();
    if (client == null) {
      throw StateError('Not connected to Google Calendar.');
    }
    try {
      final api = gcal.CalendarApi(client);
      final now = DateTime.now();
      final startOfDay = DateTime(now.year, now.month, now.day);
      final endOfTomorrow = startOfDay.add(const Duration(days: 2));
      final response = await api.events.list(
        'primary',
        timeMin: startOfDay.toUtc(),
        timeMax: endOfTomorrow.toUtc(),
        singleEvents: true, // expand recurring events into instances
        orderBy: 'startTime',
      );
      return response.items ?? const <gcal.Event>[];
    } finally {
      client.close();
    }
  }
}
