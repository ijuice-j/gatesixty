// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'schedule_providers.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning
/// The schedule source. Backed by Google Calendar — swap the implementation
/// here if the source ever changes; nothing downstream cares.

@ProviderFor(scheduleRepository)
final scheduleRepositoryProvider = ScheduleRepositoryProvider._();

/// The schedule source. Backed by Google Calendar — swap the implementation
/// here if the source ever changes; nothing downstream cares.

final class ScheduleRepositoryProvider
    extends
        $FunctionalProvider<
          ScheduleRepository,
          ScheduleRepository,
          ScheduleRepository
        >
    with $Provider<ScheduleRepository> {
  /// The schedule source. Backed by Google Calendar — swap the implementation
  /// here if the source ever changes; nothing downstream cares.
  ScheduleRepositoryProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'scheduleRepositoryProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$scheduleRepositoryHash();

  @$internal
  @override
  $ProviderElement<ScheduleRepository> $createElement(
    $ProviderPointer pointer,
  ) => $ProviderElement(pointer);

  @override
  ScheduleRepository create(Ref ref) {
    return scheduleRepository(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(ScheduleRepository value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<ScheduleRepository>(value),
    );
  }
}

String _$scheduleRepositoryHash() =>
    r'7303dfedfd17728efb8fab88fcd8b2448ccedb4e';

/// Today's events. Only fetched while signed in (the UI gates on auth state,
/// so this isn't watched when disconnected). Auto-refreshes every 10 minutes,
/// and is also invalidated on app resume.

@ProviderFor(schedule)
final scheduleProvider = ScheduleProvider._();

/// Today's events. Only fetched while signed in (the UI gates on auth state,
/// so this isn't watched when disconnected). Auto-refreshes every 10 minutes,
/// and is also invalidated on app resume.

final class ScheduleProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<ScheduleEvent>>,
          List<ScheduleEvent>,
          FutureOr<List<ScheduleEvent>>
        >
    with
        $FutureModifier<List<ScheduleEvent>>,
        $FutureProvider<List<ScheduleEvent>> {
  /// Today's events. Only fetched while signed in (the UI gates on auth state,
  /// so this isn't watched when disconnected). Auto-refreshes every 10 minutes,
  /// and is also invalidated on app resume.
  ScheduleProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'scheduleProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$scheduleHash();

  @$internal
  @override
  $FutureProviderElement<List<ScheduleEvent>> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<List<ScheduleEvent>> create(Ref ref) {
    return schedule(ref);
  }
}

String _$scheduleHash() => r'd0aa5c3b3000ac9167d58425ab8c0f9c2fb5cf93';

/// Live "what's now / what's next" snapshot. Returns empty when disconnected
/// (so no fetch is attempted); otherwise recomputed every second off the
/// [clockTickerProvider] so the countdown stays current.

@ProviderFor(scheduleStatus)
final scheduleStatusProvider = ScheduleStatusProvider._();

/// Live "what's now / what's next" snapshot. Returns empty when disconnected
/// (so no fetch is attempted); otherwise recomputed every second off the
/// [clockTickerProvider] so the countdown stays current.

final class ScheduleStatusProvider
    extends $FunctionalProvider<ScheduleStatus, ScheduleStatus, ScheduleStatus>
    with $Provider<ScheduleStatus> {
  /// Live "what's now / what's next" snapshot. Returns empty when disconnected
  /// (so no fetch is attempted); otherwise recomputed every second off the
  /// [clockTickerProvider] so the countdown stays current.
  ScheduleStatusProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'scheduleStatusProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$scheduleStatusHash();

  @$internal
  @override
  $ProviderElement<ScheduleStatus> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  ScheduleStatus create(Ref ref) {
    return scheduleStatus(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(ScheduleStatus value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<ScheduleStatus>(value),
    );
  }
}

String _$scheduleStatusHash() => r'd647f5158cd1ac3ec730f6bd87def363a2d2efd5';
