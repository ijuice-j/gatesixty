import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/time_formatting.dart';
import '../../../settings/presentation/settings_controller.dart';
import '../providers/schedule_providers.dart';
import 'free_time_label.dart';

/// The muted pill below the tag.
///
/// Defaults to [NextPill] ("NEXT · 🎮 … · HH:mm to HH:mm"). Tapping it reveals
/// [PastPill] — the block that just finished — for a few seconds, crossfading
/// both ways, then reverting on its own.
class UpcomingPill extends ConsumerStatefulWidget {
  const UpcomingPill({super.key});

  @override
  ConsumerState<UpcomingPill> createState() => _UpcomingPillState();
}

class _UpcomingPillState extends ConsumerState<UpcomingPill> {
  static const _reveal = Duration(seconds: 5);

  bool _showPast = false;
  Timer? _revertTimer;

  @override
  void dispose() {
    _revertTimer?.cancel();
    super.dispose();
  }

  void _onTap() {
    // Already showing PAST → tap dismisses it early, back to NEXT.
    if (_showPast) {
      _revertTimer?.cancel();
      setState(() => _showPast = false);
      return;
    }
    // Nothing to reveal if no block has finished yet.
    if (ref.read(scheduleStatusProvider).previous == null) return;
    setState(() => _showPast = true);
    _revertTimer?.cancel();
    _revertTimer = Timer(_reveal, () {
      if (mounted) setState(() => _showPast = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: _onTap,
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 350),
        transitionBuilder: (child, animation) =>
            FadeTransition(opacity: animation, child: child),
        child: _showPast
            ? const PastPill(key: ValueKey('past'))
            : const NextPill(key: ValueKey('next')),
      ),
    );
  }
}

/// Shows whatever genuinely comes next: **Free time** (when a gap follows the
/// active event before the next one starts), otherwise the next event. Hidden
/// when there's nothing current and nothing upcoming.
class NextPill extends ConsumerWidget {
  const NextPill({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final status = ref.watch(scheduleStatusProvider);
    final use24Hour = ref.watch(settingsProvider.select((s) => s.use24Hour));

    final current = status.current;
    final next = status.next;

    final Color dotColor;
    final InlineSpan label;
    final int atMinute;
    // End of the upcoming block, when known. Null only for an open-ended Free
    // gap (the active event is the last of the day), where we show just a start.
    final int? endMinute;
    if (status.freeFollows && current != null) {
      // A gap follows the active event — free time is what's next, starting
      // when the current event ends and running until the next event begins.
      dotColor = AppColors.idleDot;
      label = freeTimeLabelSpan(13);
      atMinute = current.endMinute;
      endMinute = next?.startMinute;
    } else if (next != null) {
      dotColor = next.color;
      label = TextSpan(text: next.label);
      atMinute = next.startMinute;
      endMinute = next.endMinute;
    } else {
      return const SizedBox.shrink();
    }

    return _PillChrome(
      kicker: 'NEXT',
      dotColor: dotColor,
      label: label,
      time: _formatRange(atMinute, endMinute, use24Hour: use24Hour),
    );
  }
}

/// The block that most recently finished. Hidden when nothing has ended yet.
class PastPill extends ConsumerWidget {
  const PastPill({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final status = ref.watch(scheduleStatusProvider);
    final use24Hour = ref.watch(settingsProvider.select((s) => s.use24Hour));

    final previous = status.previous;
    if (previous == null) return const SizedBox.shrink();

    return _PillChrome(
      kicker: 'PAST',
      dotColor: previous.color,
      label: TextSpan(text: previous.label),
      time: _formatRange(
        previous.startMinute,
        previous.endMinute,
        use24Hour: use24Hour,
      ),
    );
  }
}

/// `"HH:mm to HH:mm"`, or just the start when [endMinute] is unknown.
String _formatRange(int startMinute, int? endMinute, {required bool use24Hour}) {
  final start = formatClock(startMinute, use24Hour: use24Hour);
  if (endMinute == null) return start;
  return '$start to ${formatClock(endMinute, use24Hour: use24Hour)}';
}

/// Shared visual chrome for the NEXT / PAST pills: a kicker, a coloured dot,
/// the block label and its time range.
class _PillChrome extends StatelessWidget {
  const _PillChrome({
    required this.kicker,
    required this.dotColor,
    required this.label,
    required this.time,
  });

  final String kicker;
  final Color dotColor;
  final InlineSpan label;
  final String time;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0x04FFFFFF),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0x0DFFFFFF)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            kicker,
            style: const TextStyle(
              color: AppColors.nextLabel,
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 1.8,
            ),
          ),
          const SizedBox(width: 8),
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(shape: BoxShape.circle, color: dotColor),
          ),
          const SizedBox(width: 8),
          Flexible(
            child: Text.rich(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: AppColors.nextName,
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          const SizedBox(width: 8),
          Text(
            time,
            style: const TextStyle(
              color: AppColors.nextTime,
              fontFeatures: [FontFeature.tabularFigures()],
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }
}
