import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../../core/time/clock_ticker.dart';
import '../../../../core/utils/time_formatting.dart';
import '../../../settings/presentation/settings_controller.dart';

part 'clock_display_provider.g.dart';

/// View-model for the flip clock: the two-character hour/minute strings plus
/// the meridiem and current format. Immutable so equal frames don't rebuild.
class ClockDisplay {
  const ClockDisplay({
    required this.hours,
    required this.minutes,
    required this.meridiem,
    required this.use24Hour,
  });

  final String hours; // "00".."23" / "01".."12"
  final String minutes; // "00".."59"
  final String meridiem; // "AM" / "PM"
  final bool use24Hour;
}

/// Derives the [ClockDisplay] from the ticker + settings. Uses `.select` on
/// the minute-of-day so this only rebuilds when the displayed minute actually
/// changes (not every second), keeping the flip widgets cheap.
@riverpod
ClockDisplay clockDisplay(Ref ref) {
  final use24Hour = ref.watch(settingsProvider.select((s) => s.use24Hour));
  final minuteOfDay = ref.watch(
    clockTickerProvider.select((async) {
      final t = async.value ?? DateTime.now();
      return t.hour * 60 + t.minute;
    }),
  );

  var h = minuteOfDay ~/ 60;
  final m = minuteOfDay % 60;
  final meridiem = h >= 12 ? 'PM' : 'AM';
  if (!use24Hour) {
    h = h % 12;
    if (h == 0) h = 12;
  }

  return ClockDisplay(
    hours: twoDigits(h),
    minutes: twoDigits(m),
    meridiem: meridiem,
    use24Hour: use24Hour,
  );
}
