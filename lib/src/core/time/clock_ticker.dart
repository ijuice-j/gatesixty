import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'clock_ticker.g.dart';

/// A single source of "now" for the whole app.
///
/// Emits the current [DateTime] immediately, then re-emits once per second
/// aligned to the wall-clock second boundary. This mirrors the original
/// self-correcting `setTimeout(tick, 1000 - Date.now() % 1000)` loop, so the
/// clock never drifts and ticks land on the second.
@riverpod
Stream<DateTime> clockTicker(Ref ref) async* {
  while (true) {
    final now = DateTime.now();
    yield now;
    final msToNextSecond = 1000 - (now.millisecondsSinceEpoch % 1000);
    await Future<void>.delayed(Duration(milliseconds: msToNextSecond));
  }
}
