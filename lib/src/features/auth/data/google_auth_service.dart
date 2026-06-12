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

  bool get isSignedIn => _ready;

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
  Future<void> connect() async {
    final account = await _signIn.authenticate(scopeHint: scopes);
    _currentUser = account;
    await account.authorizationClient.authorizeScopes(scopes);
    _setReady(true);
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
