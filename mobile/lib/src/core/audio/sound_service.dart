import 'package:flutter/services.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'sound_service.g.dart';

/// Plays short sound effects (the 1-up chime on every tag swap).
///
/// Backed by a native platform channel (Android `MediaPlayer` in
/// `MainActivity.kt`) rather than a Dart audio package — every such package
/// either pulls `path_provider` (which drags in the `jni`/`objective_c`
/// native-asset build hooks that break on this machine's spaced SDK path) or
/// is too old to build against the current Android SDK.
class SoundService {
  static const MethodChannel _channel =
      MethodChannel('life.ispassingme.by/sound');

  /// Plays the 1-up chime that marks a tag swap. Playback failures are
  /// swallowed — the sound is non-critical.
  Future<void> playTagSwap() async {
    try {
      await _channel.invokeMethod<void>('playOneUp');
    } on PlatformException {
      // ignore — sound is non-critical
    } on MissingPluginException {
      // ignore — e.g. on platforms without the native handler
    }
  }
}

@Riverpod(keepAlive: true)
SoundService soundService(Ref ref) => SoundService();
