import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../features/schedule/presentation/screens/agenda_screen.dart';
import '../home_gate.dart';

part 'app_router.g.dart';

/// The app's router. `/agenda` is a child of `/` rendered as a translucent
/// fade overlay (the clock stays mounted behind it).
@Riverpod(keepAlive: true)
GoRouter appRouter(Ref ref) {
  return GoRouter(
    initialLocation: '/',
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => const HomeGate(),
        routes: [
          GoRoute(
            path: 'agenda',
            pageBuilder: (context, state) => CustomTransitionPage<void>(
              opaque: false,
              barrierColor: Colors.transparent,
              transitionDuration: const Duration(milliseconds: 220),
              reverseTransitionDuration: const Duration(milliseconds: 220),
              child: const AgendaScreen(),
              transitionsBuilder: (context, animation, secondary, child) =>
                  FadeTransition(opacity: animation, child: child),
            ),
          ),
        ],
      ),
    ],
  );
}
