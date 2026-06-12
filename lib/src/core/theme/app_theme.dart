import 'package:flutter/material.dart';

import 'app_colors.dart';

/// Builds the dark theme.
///
/// The original design used "Instrument Sans" for the chrome (tag, agenda,
/// next-pill). For now we use the platform sans-serif to keep the dependency
/// graph free of native-asset build hooks (see notes). To restore exact
/// fidelity, bundle the Instrument Sans `.ttf` files under `assets/fonts/`,
/// declare them in `pubspec.yaml`, and set `fontFamily: 'Instrument Sans'`
/// here — no extra package needed.
ThemeData buildAppTheme() {
  final base = ThemeData.dark(useMaterial3: true);
  return base.copyWith(
    scaffoldBackgroundColor: AppColors.background,
    canvasColor: AppColors.background,
    colorScheme: base.colorScheme.copyWith(
      surface: AppColors.background,
      brightness: Brightness.dark,
    ),
  );
}
