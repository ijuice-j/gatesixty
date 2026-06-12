import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/time_formatting.dart';
import '../../../settings/presentation/settings_controller.dart';
import '../providers/schedule_providers.dart';

/// The small muted "NEXT · 🎮 … · HH:mm" pill below the tag.
///
/// Shows whatever genuinely comes next: **Free** (when a gap follows the active
/// event before the next one starts), otherwise the next event. Hidden when
/// there's nothing current and nothing upcoming.
class NextPill extends ConsumerWidget {
  const NextPill({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final status = ref.watch(scheduleStatusProvider);
    final use24Hour = ref.watch(settingsProvider.select((s) => s.use24Hour));

    final current = status.current;
    final next = status.next;

    final Color dotColor;
    final String label;
    final int atMinute;
    if (status.freeFollows && current != null) {
      // A gap follows the active event — free time is what's next, starting
      // when the current event ends.
      dotColor = AppColors.idleDot;
      label = 'Free 🎉';
      atMinute = current.endMinute;
    } else if (next != null) {
      dotColor = next.color;
      label = next.label;
      atMinute = next.startMinute;
    } else {
      return const SizedBox.shrink();
    }

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
          const Text(
            'NEXT',
            style: TextStyle(
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
            child: Text(
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
            formatClock(atMinute, use24Hour: use24Hour),
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
