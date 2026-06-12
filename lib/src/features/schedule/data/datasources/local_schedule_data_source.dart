import '../../../../core/config/app_config.dart';
import '../models/schedule_event_dto.dart';

/// Local, hardcoded routine — the direct port of the original `SCHEDULE`
/// array. This whole class is the seam that a Google Calendar data source
/// will replace in phase 2.
class LocalScheduleDataSource {
  const LocalScheduleDataSource();

  /// The user's daily routine. Edit times/names/colors here for now.
  /// Times are 24h `"HH:mm"`; an event may cross midnight (end <= start).
  static const List<ScheduleEventDto> _routine = [
    ScheduleEventDto(
      name: 'Reading',
      emoji: '📕',
      start: '01:30',
      end: '02:30',
      colorHex: '#7B81C9',
    ),
    ScheduleEventDto(
      name: 'LastSeenPlaying – 3.0xS3',
      emoji: '🎮',
      start: '03:00',
      end: '06:00',
      colorHex: '#4E9466',
    ),
    ScheduleEventDto(
      name: 'Resting',
      emoji: '😴',
      start: '09:00',
      end: '15:00',
      colorHex: '#7B81C9',
    ),
    ScheduleEventDto(
      name: 'LastSeenPlaying – 1.5xS1',
      emoji: '🎮',
      start: '16:30',
      end: '18:00',
      colorHex: '#4E9466',
    ),
    ScheduleEventDto(
      name: 'Workout + Shake + Refresh',
      emoji: '💪',
      start: '18:15',
      end: '20:00',
      colorHex: '#7B81C9',
    ),
    ScheduleEventDto(
      name: 'LastSeenPlaying – 3.0xS2',
      emoji: '🎮',
      start: '22:30',
      end: '01:30',
      colorHex: '#4E9466',
    ),
  ];

  Future<List<ScheduleEventDto>> getSchedule() async {
    if (AppConfig.scheduleTestMode) return _generateTestSchedule();
    return _routine;
  }

  /// Mirrors the original `TEST_MODE`, but compressed for testing: every event
  /// is exactly 1 minute, back-to-back, starting from the next full minute — so
  /// a session completes (and the 1-up chime fires) once a minute.
  List<ScheduleEventDto> _generateTestSchedule() {
    final now = DateTime.now();
    var t = now.hour * 60 + now.minute + 1; // next full minute
    const durationMin = 1; // each event lasts 1 minute
    const gapMin = 0; // back-to-back

    final result = <ScheduleEventDto>[];
    for (var i = 0; i < _routine.length; i++) {
      final base = _routine[i];
      result.add(
        ScheduleEventDto(
          name: base.name,
          emoji: base.emoji,
          start: _formatHHmm(t % 1440),
          end: _formatHHmm((t + durationMin) % 1440),
          colorHex: base.colorHex,
        ),
      );
      t += durationMin + gapMin;
    }
    return result;
  }

  String _formatHHmm(int minutes) {
    final h = minutes ~/ 60;
    final m = minutes % 60;
    return '${h.toString().padLeft(2, '0')}:${m.toString().padLeft(2, '0')}';
  }
}
