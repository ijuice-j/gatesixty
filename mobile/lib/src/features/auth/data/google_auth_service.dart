import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:googleapis/calendar/v3.dart' show CalendarApi;
import 'package:http/http.dart' as http;

import '../../../core/config/app_config.dart';

/// Wraps `google_sign_in` v7 (the authentication / authorization-split API).
///
/// "Signed in" here means **authenticated _and_ the read-only Calendar scope
/// is authorized** — so the schedule fetch never runs before it can succeed.
class GoogleAuthService {
  GoogleAuthService();

  /// Read-only Calendar scope.
  static const List<String> scopes = [CalendarApi.calendarReadonlyScope];

  final GoogleSignIn _signIn = GoogleSignIn.instance;
  final StreamController<bool> _readyController =
      StreamController<bool>.broadcast();

  GoogleSignInAccount? _currentUser;
  bool _ready = false; // authenticated AND Calendar scope authorized
  bool _initialized = false;
  Future<void>? _restoreFuture;
  String? _lastConnectError;

  bool get isSignedIn => _ready;

  /// Why the last [connect] failed, or `null` if it didn't (or was cancelled).
  ///
  /// Exists because a swallowed [GoogleSignInException] and a deliberate cancel look
  /// identical from the outside: the button returns to its idle label and nothing else
  /// changes. That is indistinguishable from "the app is broken", and the code inside the
  /// exception — `clientConfigurationError` vs `providerConfigurationError` vs
  /// `uiUnavailable` — is the one thing that says which.
  String? get lastConnectError => _lastConnectError;

  /// The current Google ID token (a JWT), or `null` when no user is present.
  /// Exchanged for a Supabase session (`signInWithIdToken`) so RLS-protected
  /// writes run as this user. In v7 `authentication` is a synchronous getter.
  String? get idToken => _currentUser?.authentication.idToken;

  /// Emits `true` once authenticated + authorized, `false` on sign-out.
  Stream<bool> get signedInChanges => _readyController.stream;

  /// Initializes the SDK, listens for auth events, and silently restores a
  /// previous session (marking ready only if the Calendar scope is still
  /// granted). Call once at startup, before `runApp`.
  Future<void> initialize() async {
    if (_initialized) return;
    _initialized = true;

    await _signIn.initialize(
      serverClientId: AppConfig.googleServerClientId.isEmpty
          ? null
          : AppConfig.googleServerClientId,
    );

    _signIn.authenticationEvents.listen((event) {
      switch (event) {
        case GoogleSignInAuthenticationEventSignIn():
          _currentUser = event.user;
          // Readiness also needs the scope; confirmed by connect()/restore.
        case GoogleSignInAuthenticationEventSignOut():
          _currentUser = null;
          _setReady(false);
      }
    });

    // Silent restore runs in the background so it never blocks first paint or
    // throws out of startup (the lightweight flow can surface a dismissible
    // selector and/or throw `canceled`).
    _restoreFuture = _attemptRestore();
  }

  /// Completes once the initial silent-restore has settled — lets the UI avoid
  /// flashing onboarding while a returning session is being restored.
  Future<void> get whenRestored => _restoreFuture ?? Future<void>.value();

  Future<void> _attemptRestore() async {
    try {
      final attempt = _signIn.attemptLightweightAuthentication();
      final account = attempt == null ? null : await attempt;
      if (account != null) _currentUser = account;
      debugPrint('[auth] lightweight restore -> ${account?.email ?? 'null'}');
    } on GoogleSignInException catch (e) {
      debugPrint('[auth] lightweight restore exception: ${e.code}');
    } catch (e) {
      debugPrint('[auth] lightweight restore error: $e');
    }
    await _refreshReadiness();
  }

  /// Interactive sign-in + authorization of the Calendar scope.
  ///
  /// Records why it failed before rethrowing, so the caller can keep its existing
  /// control flow and the UI still has something to show.
  Future<void> connect() async {
    _lastConnectError = null;
    try {
      final account = await _signIn.authenticate(scopeHint: scopes);
      _currentUser = account;
      await account.authorizationClient.authorizeScopes(scopes);
      _setReady(true);
    } on GoogleSignInException catch (e) {
      // A cancel is not a failure and must not leave an error on screen — you closed
      // the sheet, you know why nothing happened.
      _lastConnectError =
          e.code == GoogleSignInExceptionCode.canceled ? null : describeSignInError(e);
      debugPrint('[auth] connect failed: ${e.code.name} — ${e.description}');
      rethrow;
    } catch (e) {
      _lastConnectError = 'Sign-in failed: $e';
      debugPrint('[auth] connect error: $e');
      rethrow;
    }
  }

  Future<void> disconnect() async {
    await _signIn.disconnect();
    _currentUser = null;
    _setReady(false);
  }

  /// Marks ready iff a user is present and the Calendar scope is already
  /// authorized without prompting (used after a silent restore).
  Future<void> _refreshReadiness() async {
    final account = _currentUser;
    if (account == null) {
      debugPrint('[auth] readiness: no account');
      _setReady(false);
      return;
    }
    try {
      final client = account.authorizationClient;
      final existing = await client.authorizationForScopes(scopes);
      debugPrint(
        '[auth] authorizationForScopes -> ${existing != null ? 'token' : 'null'}',
      );
      // A restored session has no *cached unexpired* access token, so
      // authorizationForScopes returns null even when the scope is granted.
      // authorizeScopes re-grants it (throws on failure) — and is silent for
      // an already-approved scope.
      if (existing == null) {
        await client.authorizeScopes(scopes);
        debugPrint('[auth] authorizeScopes -> token');
      }
      _setReady(true);
    } on GoogleSignInException catch (e) {
      debugPrint('[auth] readiness authorize failed: ${e.code}');
      _setReady(false);
    } catch (e) {
      debugPrint('[auth] readiness error: $e');
      _setReady(false);
    }
  }

  void _setReady(bool value) {
    if (value == _ready) return;
    _ready = value;
    _readyController.add(value);
  }

  /// An [http.Client] that injects a fresh Calendar access token per request,
  /// or `null` when not signed in. The caller owns it and must `close()` it.
  http.Client? authorizedClient() {
    final account = _currentUser;
    if (account == null) return null;
    return _AuthorizedClient(account.authorizationClient, scopes, http.Client());
  }

  void dispose() {
    _readyController.close();
  }
}

/// Turns a [GoogleSignInException] into something worth putting on a screen.
///
/// The raw `toString()` is a Dart type name and an enum, which tells a user nothing and
/// tells a developer only slightly more. These map each code to what actually has to be
/// fixed — the configuration errors in particular, which on Android are almost always a
/// signing-certificate SHA-1 that isn't registered against the OAuth client.
String describeSignInError(GoogleSignInException e) {
  final detail = (e.description ?? '').trim();
  final suffix = detail.isEmpty ? '' : '\n$detail';
  switch (e.code) {
    case GoogleSignInExceptionCode.canceled:
      return 'Sign-in cancelled.';
    case GoogleSignInExceptionCode.interrupted:
      return 'Sign-in was interrupted. Check your connection and try again.$suffix';
    case GoogleSignInExceptionCode.clientConfigurationError:
      return "This build isn't registered with Google. Its signing certificate (SHA-1) "
          'needs adding to the Android OAuth client in Google Cloud Console.$suffix';
    case GoogleSignInExceptionCode.providerConfigurationError:
      return 'Google Sign-In is misconfigured for this app — check the OAuth client and '
          'that Google Play services is available on this device.$suffix';
    case GoogleSignInExceptionCode.uiUnavailable:
      return "Google couldn't show the sign-in screen. Update Google Play services and "
          'try again.$suffix';
    case GoogleSignInExceptionCode.userMismatch:
      return 'That was a different Google account than the one being re-authorized.$suffix';
    case GoogleSignInExceptionCode.unknownError:
      return 'Sign-in failed (${e.code.name}).$suffix';
  }
}

/// Adds the Google authorization header (Bearer access token) to every request.
class _AuthorizedClient extends http.BaseClient {
  _AuthorizedClient(this._authz, this._scopes, this._inner);

  final GoogleSignInAuthorizationClient _authz;
  final List<String> _scopes;
  final http.Client _inner;

  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) async {
    // promptIfNecessary refreshes an expired token silently for a granted
    // scope (only surfaces UI if the grant was actually revoked).
    final headers =
        await _authz.authorizationHeaders(_scopes, promptIfNecessary: true);
    if (headers != null) request.headers.addAll(headers);
    return _inner.send(request);
  }

  @override
  void close() {
    _inner.close();
    super.close();
  }
}
