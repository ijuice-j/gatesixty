import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'settings_controller.g.dart';

/// Immutable UI/display preferences. Kept as its own state object so it can
/// grow (theme, persistence, etc.) without touching call sites.
class SettingsState {
  const SettingsState({this.use24Hour = false});

  final bool use24Hour;

  SettingsState copyWith({bool? use24Hour}) =>
      SettingsState(use24Hour: use24Hour ?? this.use24Hour);
}

/// Holds display preferences. In-memory for now (matches the original, which
/// reset on reload); swap `build()` for a persisted load when desired.
@riverpod
class Settings extends _$Settings {
  @override
  SettingsState build() => const SettingsState();

  /// Toggles between 12-hour (AM/PM) and 24-hour clock display.
  void toggleClockFormat() =>
      state = state.copyWith(use24Hour: !state.use24Hour);
}
