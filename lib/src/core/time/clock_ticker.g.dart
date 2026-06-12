// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'clock_ticker.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning
/// A single source of "now" for the whole app.
///
/// Emits the current [DateTime] immediately, then re-emits once per second
/// aligned to the wall-clock second boundary. This mirrors the original
/// self-correcting `setTimeout(tick, 1000 - Date.now() % 1000)` loop, so the
/// clock never drifts and ticks land on the second.

@ProviderFor(clockTicker)
final clockTickerProvider = ClockTickerProvider._();

/// A single source of "now" for the whole app.
///
/// Emits the current [DateTime] immediately, then re-emits once per second
/// aligned to the wall-clock second boundary. This mirrors the original
/// self-correcting `setTimeout(tick, 1000 - Date.now() % 1000)` loop, so the
/// clock never drifts and ticks land on the second.

final class ClockTickerProvider
    extends
        $FunctionalProvider<AsyncValue<DateTime>, DateTime, Stream<DateTime>>
    with $FutureModifier<DateTime>, $StreamProvider<DateTime> {
  /// A single source of "now" for the whole app.
  ///
  /// Emits the current [DateTime] immediately, then re-emits once per second
  /// aligned to the wall-clock second boundary. This mirrors the original
  /// self-correcting `setTimeout(tick, 1000 - Date.now() % 1000)` loop, so the
  /// clock never drifts and ticks land on the second.
  ClockTickerProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'clockTickerProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$clockTickerHash();

  @$internal
  @override
  $StreamProviderElement<DateTime> $createElement($ProviderPointer pointer) =>
      $StreamProviderElement(pointer);

  @override
  Stream<DateTime> create(Ref ref) {
    return clockTicker(ref);
  }
}

String _$clockTickerHash() => r'77712f2590da555151745f18337bfab03437642c';
