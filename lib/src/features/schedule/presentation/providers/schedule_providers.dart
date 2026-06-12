import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../../core/time/clock_ticker.dart';
import '../../../auth/presentation/auth_providers.dart';
import '../../data/datasources/google_calendar_data_source.dart';
import '../../data/repositories/google_calendar_schedule_repository.dart';
import '../../domain/entities/schedule_event.dart';
import '../../domain/entities/schedule_status.dart';
import '../../domain/repositories/schedule_repository.dart';

part 'schedule_providers.g.dart';

/// The schedule source. Backed by Google Calendar — swap the implementation
/// here if the source ever changes; nothing downstream cares.
@riverpod
ScheduleRepository scheduleRepository(Ref ref) =>
    GoogleCalendarScheduleRepository(
      GoogleCalendarDataSource(ref.watch(googleAuthServiceProvider)),
    );

/// Today's events. Only fetched while signed in (the UI gates on auth state,
/// so this isn't watched when disconnected). Auto-refreshes every 10 minutes,
/// and is also invalidated on app resume.
@riverpod
Future<List<ScheduleEvent>> schedule(Ref ref) {
  final timer = Timer(const Duration(minutes: 10), ref.invalidateSelf);
  ref.onDispose(timer.cancel);
  return ref.watch(scheduleRepositoryProvider).getTodaySchedule();
}

/// Live "what's now / what's next" snapshot. Returns empty when disconnected
/// (so no fetch is attempted); otherwise recomputed every second off the
/// [clockTickerProvider] so the countdown stays current.
@riverpod
ScheduleStatus scheduleStatus(Ref ref) {
  final signedIn = ref.watch(authStateProvider).value ?? false;
  if (!signedIn) return const ScheduleStatus();

  final events =
      ref.watch(scheduleProvider).value ?? const <ScheduleEvent>[];
  final now = ref.watch(
    clockTickerProvider.select((async) => async.value ?? DateTime.now()),
  );
  final nowMinute = now.hour * 60 + now.minute + now.second / 60.0;
  return ScheduleStatus.resolve(events, nowMinute);
}
