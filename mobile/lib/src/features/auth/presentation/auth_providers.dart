import 'package:google_sign_in/google_sign_in.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../data/google_auth_service.dart';

part 'auth_providers.g.dart';

/// The shared [GoogleAuthService] (initialized in `main()` before `runApp`).
@Riverpod(keepAlive: true)
GoogleAuthService googleAuthService(Ref ref) {
  final service = GoogleAuthService();
  ref.onDispose(service.dispose);
  return service;
}

/// Whether the user is connected to Google Calendar (authenticated +
/// authorized). Seeds with the current state, then follows auth events.
@riverpod
Stream<bool> authState(Ref ref) async* {
  final service = ref.watch(googleAuthServiceProvider);
  yield service.isSignedIn;
  yield* service.signedInChanges;
}

/// Completes when the startup silent-restore has settled (loading until then).
@riverpod
Future<void> authRestored(Ref ref) =>
    ref.watch(googleAuthServiceProvider).whenRestored;

/// Whether the user chose "Skip" on the onboarding screen (in-memory, this
/// session) — lets them use the bare flip clock without connecting.
@riverpod
class OnboardingSkipped extends _$OnboardingSkipped {
  @override
  bool build() => false;

  void skip() => state = true;
}

/// Drives connect/disconnect; `state` is `true` while a connect is in flight.
@riverpod
class AuthController extends _$AuthController {
  @override
  bool build() => false;

  Future<void> connect() async {
    if (state) return;
    state = true;
    try {
      await ref.read(googleAuthServiceProvider).connect();
    } on GoogleSignInException {
      // Still swallowed here — the service has already recorded WHY in
      // `lastConnectError`, and the onboarding screen reads it when this `state` flips
      // back to false. Rethrowing would only turn a handled failure into a red screen.
    } finally {
      state = false;
    }
  }

  Future<void> disconnect() =>
      ref.read(googleAuthServiceProvider).disconnect();
}
