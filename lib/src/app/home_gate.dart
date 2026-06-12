import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/theme/app_colors.dart';
import '../features/auth/presentation/auth_providers.dart';
import '../features/auth/presentation/screens/onboarding_screen.dart';
import '../features/clock/presentation/screens/clock_screen.dart';

/// Decides the home screen: the onboarding page until the user either connects
/// or skips, then the flip clock. Reacts to auth state, so a successful sign-in
/// flips straight to the clock.
class HomeGate extends ConsumerWidget {
  const HomeGate({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // While the startup silent-restore is in flight, show a neutral black
    // screen (continuing the splash) so a returning user never sees the
    // onboarding screen flash before their clock appears.
    final restored = ref.watch(authRestoredProvider);
    if (restored.isLoading) {
      return const ColoredBox(color: AppColors.background);
    }

    final signedIn = ref.watch(authStateProvider).value ?? false;
    final skipped = ref.watch(onboardingSkippedProvider);
    if (signedIn || skipped) return const ClockScreen();
    return const OnboardingScreen();
  }
}
