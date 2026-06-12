import 'package:googleapis/calendar/v3.dart' as gcal;

import '../../../auth/data/google_auth_service.dart';

/// Fetches today's events from the user's primary Google Calendar.
class GoogleCalendarDataSource {
  GoogleCalendarDataSource(this._authService);

  final GoogleAuthService _authService;

  Future<List<gcal.Event>> getTodayEvents() async {
    final client = _authService.authorizedClient();
    if (client == null) {
      throw StateError('Not connected to Google Calendar.');
    }
    try {
      final api = gcal.CalendarApi(client);
      final now = DateTime.now();
      final startOfDay = DateTime(now.year, now.month, now.day);
      final endOfDay = startOfDay.add(const Duration(days: 1));
      final response = await api.events.list(
        'primary',
        timeMin: startOfDay.toUtc(),
        timeMax: endOfDay.toUtc(),
        singleEvents: true, // expand recurring events into instances
        orderBy: 'startTime',
      );
      return response.items ?? const <gcal.Event>[];
    } finally {
      client.close();
    }
  }
}
