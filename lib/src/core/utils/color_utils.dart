import 'package:flutter/material.dart';

/// Mixes [color] toward white (`amount > 0`) or black (`amount < 0`), with
/// `amount` in `-1..1`. Ported from the original `mix()` helper. Uses the
/// modern wide-gamut `Color` component API (`.r/.g/.b`, `Color.from`).
Color mixColor(Color color, double amount) {
  final target = amount < 0 ? 0.0 : 1.0;
  final p = amount.abs();
  double towards(double channel) => channel + (target - channel) * p;
  return Color.from(
    alpha: 1.0,
    red: towards(color.r),
    green: towards(color.g),
    blue: towards(color.b),
  );
}

/// `#RRGGBB` hex string for [color] (alpha ignored). Used to snapshot an
/// event's accent color into the tracking ledger so a past outcome keeps its
/// colour even if the source calendar event later changes.
String hexFromColor(Color color) {
  int channel(double c) => (c * 255).round().clamp(0, 255);
  final rgb = (channel(color.r) << 16) | (channel(color.g) << 8) | channel(color.b);
  return '#${rgb.toRadixString(16).padLeft(6, '0').toUpperCase()}';
}

/// Horizontal gradient used for the active progress bar — a lightened-to-
/// darkened sweep of the event's accent color. Ported from `barGradient()`.
LinearGradient barGradient(Color color) => LinearGradient(
  begin: Alignment.centerLeft,
  end: Alignment.centerRight,
  colors: [mixColor(color, 0.32), color, mixColor(color, -0.32)],
  stops: const [0.0, 0.55, 1.0],
);
