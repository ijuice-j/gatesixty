// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'clock_display_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning
/// Derives the [ClockDisplay] from the ticker + settings. Uses `.select` on
/// the minute-of-day so this only rebuilds when the displayed minute actually
/// changes (not every second), keeping the flip widgets cheap.

@ProviderFor(clockDisplay)
final clockDisplayProvider = ClockDisplayProvider._();

/// Derives the [ClockDisplay] from the ticker + settings. Uses `.select` on
/// the minute-of-day so this only rebuilds when the displayed minute actually
/// changes (not every second), keeping the flip widgets cheap.

final class ClockDisplayProvider
    extends $FunctionalProvider<ClockDisplay, ClockDisplay, ClockDisplay>
    with $Provider<ClockDisplay> {
  /// Derives the [ClockDisplay] from the ticker + settings. Uses `.select` on
  /// the minute-of-day so this only rebuilds when the displayed minute actually
  /// changes (not every second), keeping the flip widgets cheap.
  ClockDisplayProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'clockDisplayProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$clockDisplayHash();

  @$internal
  @override
  $ProviderElement<ClockDisplay> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  ClockDisplay create(Ref ref) {
    return clockDisplay(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(ClockDisplay value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<ClockDisplay>(value),
    );
  }
}

String _$clockDisplayHash() => r'e318a8714eb5ae4ebf769e71e9a60a3a227622b9';
