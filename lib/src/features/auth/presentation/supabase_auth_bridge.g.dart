// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'supabase_auth_bridge.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning
/// Mirrors the Google auth state into a Supabase session.
///
/// Google Calendar stays the source of truth for identity; this exchanges the
/// Google **ID token** for a Supabase session (`signInWithIdToken`) so that
/// Row-Level-Security-protected writes — the activity-tracking ledger — run as
/// the signed-in user. Signing out of Google clears the Supabase session too.
///
/// Watch this provider somewhere durable (the clock screen) so the mirror runs
/// for as long as the app is up. `state` is whether a Supabase session is live.

@ProviderFor(SupabaseAuthBridge)
final supabaseAuthBridgeProvider = SupabaseAuthBridgeProvider._();

/// Mirrors the Google auth state into a Supabase session.
///
/// Google Calendar stays the source of truth for identity; this exchanges the
/// Google **ID token** for a Supabase session (`signInWithIdToken`) so that
/// Row-Level-Security-protected writes — the activity-tracking ledger — run as
/// the signed-in user. Signing out of Google clears the Supabase session too.
///
/// Watch this provider somewhere durable (the clock screen) so the mirror runs
/// for as long as the app is up. `state` is whether a Supabase session is live.
final class SupabaseAuthBridgeProvider
    extends $NotifierProvider<SupabaseAuthBridge, bool> {
  /// Mirrors the Google auth state into a Supabase session.
  ///
  /// Google Calendar stays the source of truth for identity; this exchanges the
  /// Google **ID token** for a Supabase session (`signInWithIdToken`) so that
  /// Row-Level-Security-protected writes — the activity-tracking ledger — run as
  /// the signed-in user. Signing out of Google clears the Supabase session too.
  ///
  /// Watch this provider somewhere durable (the clock screen) so the mirror runs
  /// for as long as the app is up. `state` is whether a Supabase session is live.
  SupabaseAuthBridgeProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'supabaseAuthBridgeProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$supabaseAuthBridgeHash();

  @$internal
  @override
  SupabaseAuthBridge create() => SupabaseAuthBridge();

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(bool value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<bool>(value),
    );
  }
}

String _$supabaseAuthBridgeHash() =>
    r'2fc7a3a9c1fd4a7f97661d889336c361e4f6516f';

/// Mirrors the Google auth state into a Supabase session.
///
/// Google Calendar stays the source of truth for identity; this exchanges the
/// Google **ID token** for a Supabase session (`signInWithIdToken`) so that
/// Row-Level-Security-protected writes — the activity-tracking ledger — run as
/// the signed-in user. Signing out of Google clears the Supabase session too.
///
/// Watch this provider somewhere durable (the clock screen) so the mirror runs
/// for as long as the app is up. `state` is whether a Supabase session is live.

abstract class _$SupabaseAuthBridge extends $Notifier<bool> {
  bool build();
  @$mustCallSuper
  @override
  WhenComplete runBuild() {
    final ref = this.ref as $Ref<bool, bool>;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<bool, bool>,
              bool,
              Object?,
              Object?
            >;
    return element.handleCreate(ref, build);
  }
}
