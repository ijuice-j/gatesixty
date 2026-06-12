// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'settings_controller.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning
/// Holds display preferences. In-memory for now (matches the original, which
/// reset on reload); swap `build()` for a persisted load when desired.

@ProviderFor(Settings)
final settingsProvider = SettingsProvider._();

/// Holds display preferences. In-memory for now (matches the original, which
/// reset on reload); swap `build()` for a persisted load when desired.
final class SettingsProvider
    extends $NotifierProvider<Settings, SettingsState> {
  /// Holds display preferences. In-memory for now (matches the original, which
  /// reset on reload); swap `build()` for a persisted load when desired.
  SettingsProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'settingsProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$settingsHash();

  @$internal
  @override
  Settings create() => Settings();

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(SettingsState value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<SettingsState>(value),
    );
  }
}

String _$settingsHash() => r'f4be9eeed0bc517a7ba9b4282f3b1183a1bd3e0e';

/// Holds display preferences. In-memory for now (matches the original, which
/// reset on reload); swap `build()` for a persisted load when desired.

abstract class _$Settings extends $Notifier<SettingsState> {
  SettingsState build();
  @$mustCallSuper
  @override
  WhenComplete runBuild() {
    final ref = this.ref as $Ref<SettingsState, SettingsState>;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<SettingsState, SettingsState>,
              SettingsState,
              Object?,
              Object?
            >;
    return element.handleCreate(ref, build);
  }
}
