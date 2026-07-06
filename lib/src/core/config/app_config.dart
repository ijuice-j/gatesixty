/// App-wide configuration flags.
class AppConfig {
  AppConfig._();

  /// Google OAuth **Web** client ID (from the Cloud Console "Web application"
  /// OAuth client), used as `serverClientId`. Paste it here.
  ///
  /// Leave empty to initialize sign-in without a server client ID.
  static const String googleServerClientId =
      '284122578673-oh1jpj1qp3kh60f9cnf058f8a8s3r0ij.apps.googleusercontent.com';

  /// Supabase project URL for the Gate60 backend (activity-tracking ledger).
  static const String supabaseUrl = 'https://fcmztsyvrqltidpcohhs.supabase.co';

  /// Supabase publishable key. Safe to ship in the client: Row-Level Security
  /// restricts every row to its owner (`auth.uid()`), so this key alone grants
  /// no access to another user's data.
  static const String supabasePublishableKey =
      'sb_publishable_vlFKFgLTD9Y30mKnoDZ-dg_ahrITGcY';

  /// Legacy local/test schedule flag from the original HTML port. No longer
  /// wired into the running app (the schedule now comes from Google Calendar),
  /// kept only for reference.
  static const bool scheduleTestMode = true;
}
