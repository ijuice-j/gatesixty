import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'src/app/app.dart';
import 'src/core/config/app_config.dart';
import 'src/features/auth/presentation/auth_providers.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize the Supabase backend (activity-tracking ledger). Its session is
  // established later by exchanging the Google ID token (see SupabaseAuthBridge).
  await Supabase.initialize(
    url: AppConfig.supabaseUrl,
    publishableKey: AppConfig.supabasePublishableKey,
  );
  // Lock to landscape — this is a wall/desk clock layout.
  await SystemChrome.setPreferredOrientations(const [
    DeviceOrientation.landscapeLeft,
    DeviceOrientation.landscapeRight,
  ]);
  // Immersive fullscreen — hide the status and navigation bars. They reappear
  // transiently on an edge swipe (so the user can still leave), then auto-hide.
  await SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);

  // Initialize Google sign-in and silently restore a prior session before the
  // first frame, so the clock comes up already connected when possible. Uses a
  // shared container so the app reuses the initialized service.
  final container = ProviderContainer();
  await container.read(googleAuthServiceProvider).initialize();

  runApp(
    UncontrolledProviderScope(
      container: container,
      child: const FlipClockApp(),
    ),
  );
}
