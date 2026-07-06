import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'auth_providers.dart';

part 'supabase_auth_bridge.g.dart';

/// Mirrors the Google auth state into a Supabase session.
///
/// Google Calendar stays the source of truth for identity; this exchanges the
/// Google **ID token** for a Supabase session (`signInWithIdToken`) so that
/// Row-Level-Security-protected writes — the activity-tracking ledger — run as
/// the signed-in user. Signing out of Google clears the Supabase session too.
///
/// Watch this provider somewhere durable (the clock screen) so the mirror runs
/// for as long as the app is up. `state` is whether a Supabase session is live.
@Riverpod(keepAlive: true)
class SupabaseAuthBridge extends _$SupabaseAuthBridge {
  @override
  bool build() {
    ref.listen(authStateProvider, (prev, next) {
      final signedIn = next.value ?? false;
      final wasSignedIn = prev?.value ?? false;
      if (signedIn && !wasSignedIn) {
        _establishSession();
      } else if (!signedIn && wasSignedIn) {
        _clearSession();
      }
    }, fireImmediately: true);

    return _client.auth.currentSession != null;
  }

  SupabaseClient get _client => Supabase.instance.client;

  Future<void> _establishSession() async {
    // A persisted session from a prior run (supabase_flutter auto-refreshes it)
    // is already the right user — reuse it rather than re-exchanging a token.
    if (_client.auth.currentSession != null) {
      state = true;
      return;
    }
    final idToken = ref.read(googleAuthServiceProvider).idToken;
    if (idToken == null) {
      state = false;
      return;
    }
    try {
      await _client.auth.signInWithIdToken(
        provider: OAuthProvider.google,
        idToken: idToken,
      );
      state = true;
    } catch (_) {
      // Tracking simply won't persist until a session is established; the UI
      // stays fully usable (the clock never depends on Supabase).
      state = false;
    }
  }

  Future<void> _clearSession() async {
    try {
      await _client.auth.signOut();
    } catch (_) {}
    state = false;
  }
}
