// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'tracking_providers.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning
/// The tracking backend. Supabase-backed; swap here if it ever changes.

@ProviderFor(trackingRepository)
final trackingRepositoryProvider = TrackingRepositoryProvider._();

/// The tracking backend. Supabase-backed; swap here if it ever changes.

final class TrackingRepositoryProvider
    extends
        $FunctionalProvider<
          TrackingRepository,
          TrackingRepository,
          TrackingRepository
        >
    with $Provider<TrackingRepository> {
  /// The tracking backend. Supabase-backed; swap here if it ever changes.
  TrackingRepositoryProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'trackingRepositoryProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$trackingRepositoryHash();

  @$internal
  @override
  $ProviderElement<TrackingRepository> $createElement(
    $ProviderPointer pointer,
  ) => $ProviderElement(pointer);

  @override
  TrackingRepository create(Ref ref) {
    return trackingRepository(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(TrackingRepository value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<TrackingRepository>(value),
    );
  }
}

String _$trackingRepositoryHash() =>
    r'75877c84de15c009e196c9b0e054d91cb4dbdb89';

/// Holds the live "I'm doing / did this" intent per event, and freezes an
/// outcome into the ledger the moment an event ends.
///
/// Flow: the clock button toggles intent for the *current* event (keyed by its
/// stable Google Calendar instance id). When that event ends it becomes
/// [ScheduleStatus.previous]; this controller catches the transition and — only
/// if the intent was set — records a `done` row. Untouched events are never
/// written, so an absent row reads as "not done".
///
/// `state` is the set of event ids currently marked done, so the button can
/// reflect it live.

@ProviderFor(TrackingController)
final trackingControllerProvider = TrackingControllerProvider._();

/// Holds the live "I'm doing / did this" intent per event, and freezes an
/// outcome into the ledger the moment an event ends.
///
/// Flow: the clock button toggles intent for the *current* event (keyed by its
/// stable Google Calendar instance id). When that event ends it becomes
/// [ScheduleStatus.previous]; this controller catches the transition and — only
/// if the intent was set — records a `done` row. Untouched events are never
/// written, so an absent row reads as "not done".
///
/// `state` is the set of event ids currently marked done, so the button can
/// reflect it live.
final class TrackingControllerProvider
    extends $NotifierProvider<TrackingController, Set<String>> {
  /// Holds the live "I'm doing / did this" intent per event, and freezes an
  /// outcome into the ledger the moment an event ends.
  ///
  /// Flow: the clock button toggles intent for the *current* event (keyed by its
  /// stable Google Calendar instance id). When that event ends it becomes
  /// [ScheduleStatus.previous]; this controller catches the transition and — only
  /// if the intent was set — records a `done` row. Untouched events are never
  /// written, so an absent row reads as "not done".
  ///
  /// `state` is the set of event ids currently marked done, so the button can
  /// reflect it live.
  TrackingControllerProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'trackingControllerProvider',
        isAutoDispose: false,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$trackingControllerHash();

  @$internal
  @override
  TrackingController create() => TrackingController();

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(Set<String> value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<Set<String>>(value),
    );
  }
}

String _$trackingControllerHash() =>
    r'9cefdc49bb26c0e8c4aefaa41ec0c43bf46215e3';

/// Holds the live "I'm doing / did this" intent per event, and freezes an
/// outcome into the ledger the moment an event ends.
///
/// Flow: the clock button toggles intent for the *current* event (keyed by its
/// stable Google Calendar instance id). When that event ends it becomes
/// [ScheduleStatus.previous]; this controller catches the transition and — only
/// if the intent was set — records a `done` row. Untouched events are never
/// written, so an absent row reads as "not done".
///
/// `state` is the set of event ids currently marked done, so the button can
/// reflect it live.

abstract class _$TrackingController extends $Notifier<Set<String>> {
  Set<String> build();
  @$mustCallSuper
  @override
  WhenComplete runBuild() {
    final ref = this.ref as $Ref<Set<String>, Set<String>>;
    final element =
        ref.element
            as $ClassProviderElement<
              AnyNotifier<Set<String>, Set<String>>,
              Set<String>,
              Object?,
              Object?
            >;
    return element.handleCreate(ref, build);
  }
}
