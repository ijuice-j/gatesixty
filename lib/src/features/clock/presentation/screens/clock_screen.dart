import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:wakelock_plus/wakelock_plus.dart';

import '../../../../core/audio/sound_service.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../auth/presentation/auth_providers.dart';
import '../../../schedule/domain/entities/schedule_status.dart';
import '../../../schedule/presentation/providers/schedule_providers.dart';
import '../../../schedule/presentation/widgets/next_pill.dart';
import '../../../schedule/presentation/widgets/now_tag.dart';
import '../../../settings/presentation/settings_controller.dart';
import '../widgets/flip_clock.dart';

/// Size factor applied to the tag area (NowTag + NextPill).
const double _kTagScale = 0.82;

/// Size multiplier for the flip clock, on top of the auto-computed card size.
const double _kClockScale = 1.24;

/// The home screen: the flip clock vertically centred, with the tag area
/// centred in the space above it.
///
/// While this screen is in the foreground the device stays awake (wakelock)
/// and the system bars are hidden (immersive fullscreen). Both are re-asserted
/// on resume because the OS clears them while the app is backgrounded.
///
/// Single tap anywhere toggles 12/24-hour; tapping the tag opens the agenda
/// (handled by [NowTag] itself).
class ClockScreen extends ConsumerStatefulWidget {
  const ClockScreen({super.key});

  @override
  ConsumerState<ClockScreen> createState() => _ClockScreenState();
}

class _ClockScreenState extends ConsumerState<ClockScreen>
    with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _keepAwakeAndFullscreen();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    WakelockPlus.disable();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _keepAwakeAndFullscreen();
      // Pull fresh calendar data when returning to the app.
      ref.invalidate(scheduleProvider);
    }
  }

  void _keepAwakeAndFullscreen() {
    WakelockPlus.enable();
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
  }

  @override
  Widget build(BuildContext context) {
    // Play the chime on every tag swap — whenever the displayed tag changes,
    // including to/from free time (event→event, event→free, free→event).
    ref.listen<ScheduleStatus>(scheduleStatusProvider, (prev, next) {
      if (prev != null && prev.current?.id != next.current?.id) {
        ref.read(soundServiceProvider).playTagSwap();
      }
    });

    final signedIn = ref.watch(authStateProvider).value ?? false;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () => ref.read(settingsProvider.notifier).toggleClockFormat(),
        child: SafeArea(
          child: LayoutBuilder(
            builder: (context, constraints) {
              final shortest =
                  math.min(constraints.maxWidth, constraints.maxHeight);
              final cardSize =
                  math.min(constraints.maxWidth * 0.38, shortest * 0.52) *
                      _kClockScale;
              // Gentle one-time fade-in so the clock eases onto the black
              // background instead of popping in.
              return TweenAnimationBuilder<double>(
                duration: const Duration(milliseconds: 450),
                curve: Curves.easeOut,
                tween: Tween<double>(begin: 0, end: 1),
                builder: (context, opacity, child) =>
                    Opacity(opacity: opacity, child: child),
                child: Column(
                  children: [
                    // 24px breathing room above the tags.
                    const SizedBox(height: 24),
                    // Tags only when connected; otherwise just the flip clock
                    // (onboarding handles the connect flow).
                    if (signedIn) const _TagArea(),
                    // Flexible gap down to the clock (keeps the clock's bottom
                    // spacing unchanged).
                    const Spacer(),
                    FlipClock(cardSize: cardSize),
                    SizedBox(height: cardSize * 0.20),
                  ],
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}

/// NowTag + NextPill, scaled down by [_kTagScale]. The `Align(heightFactor:)`
/// makes the laid-out size the *scaled* size so it centres correctly.
class _TagArea extends StatelessWidget {
  const _TagArea();

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.topCenter,
      heightFactor: _kTagScale,
      child: Transform.scale(
        scale: _kTagScale,
        alignment: Alignment.topCenter,
        child: const Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            NowTag(),
            SizedBox(height: 13),
            NextPill(),
          ],
        ),
      ),
    );
  }
}

