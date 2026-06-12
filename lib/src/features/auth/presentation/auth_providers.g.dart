// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'auth_providers.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning
/// The shared [GoogleAuthService] (initialized in `main()` before `runApp`).

@ProviderFor(googleAuthService)
final googleAuthServiceProvider = GoogleAuthServiceProvider._();

/// The shared [GoogleAuthService] (initialized in `main()` before `runApp`).

final class GoogleAuthServiceProvider
    extends
        $FunctionalProvider<
          GoogleAuthService,
          GoogleAuthService,
          GoogleAuthService
        >
    with $Provider<GoogleAuthService> {
  /// The shared [GoogleAuthService] (initialized in `main()` before `runApp`).
  GoogleAuthServiceProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'googleAuthServiceProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$googleAuthServiceHash();

  @$internal
  @override
  $ProviderElement<GoogleAuthService> $createElement(
    $ProviderPointer pointer,
  ) => $ProviderElement(pointer);

  @override
  GoogleAuthService create(Ref ref) {
    return googleAuthService(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(GoogleAuthService value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<GoogleAuthService>(value),
    );
  }
}

String _$googleAuthServiceHash() => r'5f24ca97b94c5ab3102e165aa89f17b90bee94c3';

/// Whether the user is connected to Google Calendar (authenticated +
/// authorized). Seeds with the current state, then follows auth events.

@ProviderFor(authState)
final authStateProvider = AuthStateProvider._();

/// Whether the user is connected to Google Calendar (authenticated +
/// authorized). Seeds with the current state, then follows auth events.

final class AuthStateProvider
    extends $FunctionalProvider<AsyncValue<bool>, bool, Stream<bool>>
    with $FutureModifier<bool>, $StreamProvider<bool> {
  /// Whether the user is connected to Google Calendar (authenticated +
  /// authorized). Seeds with the current state, then follows auth events.
  AuthStateProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'authStateProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$authStateHash();

  @$internal
  @override
  $StreamProviderElement<bool> $createElement($ProviderPointer pointer) =>
      $StreamProviderElement(pointer);

  @override
  Stream<bool> create(Ref ref) {
    return authState(ref);
  }
}

String _$authStateHash() => r'0b259a714fef4ad710650df27cbc562eaf236fd3';

/// Completes when the startup silent-restore has settled (loading until then).

@ProviderFor(authRestored)
final authRestoredProvider = AuthRestoredProvider._();

/// Completes when the startup silent-restore has settled (loading until then).

final class AuthRestoredProvider
    extends $FunctionalProvider<AsyncValue<void>, void, FutureOr<void>>
    with $FutureModifier<void>, $FutureProvider<void> {
  /// Completes when the startup silent-restore has settled (loading until then).
  AuthRestoredProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'authRestoredProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$authRestoredHash();

  @$internal
  @override
  $FutureProviderElement<void> $createElement($ProviderPointer pointer) =>
      $FutureProviderElement(pointer);

  @override
  FutureOr<void> create(Ref ref) {
    return authRestored(ref);
  }
}

String _$authRestoredHash() => r'5ea221206d44f9e826ade71add5fde5d8432611b';

/// Whether the user chose "Skip" on the onboarding screen (in-memory, this
/// session) — lets them use the bare flip clock without connecting.

@ProviderFor(OnboardingSkipped)
final onboardingSkippedProvider = OnboardingSkippedProvider._();

/// Whether the user chose "Skip" on the onboarding screen (in-memory, this
/// session) — lets them use the bare flip clock without connecting.
final class OnboardingSkippedProvider
    extends $NotifierProvider<OnboardingSkipped, bool> {
  /// Whether the user chose "Skip" on the onboarding screen (in-memory, this
  /// session) — lets them use the bare flip clock without connecting.
  OnboardingSkippedProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'onboardingSkippedProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$onboardingSkippedHash();

  @$internal
  @override
  OnboardingSkipped create() => OnboardingSkipped();

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(bool value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<bool>(value),
    );
  }
}

String _$onboardingSkippedHash() => r'dbc3d51110084968b59c4caf7af77a7840150831';

/// Whether the user chose "Skip" on the onboarding screen (in-memory, this
/// session) — lets them use the bare flip clock without connecting.

abstract class _$OnboardingSkipped extends $Notifier<bool> {
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

/// Drives connect/disconnect; `state` is `true` while a connect is in flight.

@ProviderFor(AuthController)
final authControllerProvider = AuthControllerProvider._();

/// Drives connect/disconnect; `state` is `true` while a connect is in flight.
final class AuthControllerProvider
    extends $NotifierProvider<AuthController, bool> {
  /// Drives connect/disconnect; `state` is `true` while a connect is in flight.
  AuthControllerProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'authControllerProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$authControllerHash();

  @$internal
  @override
  AuthController create() => AuthController();

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(bool value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<bool>(value),
    );
  }
}

String _$authControllerHash() => r'f2d22b3089443287dec3b4e95b9fdbb07e85f4e6';

/// Drives connect/disconnect; `state` is `true` while a connect is in flight.

abstract class _$AuthController extends $Notifier<bool> {
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
