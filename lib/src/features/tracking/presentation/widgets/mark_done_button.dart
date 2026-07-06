import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../schedule/presentation/providers/schedule_providers.dart';
import '../providers/tracking_providers.dart';

/// A round check button that sits beside the NowTag.
///
/// Visible only while an event is active; tapping toggles the "I'm doing / did
/// this" intent for that event. The intent is frozen into the ledger when the
/// event ends (see [TrackingController]) — this widget is only the affordance
/// and its live filled/empty state.
class MarkDoneButton extends ConsumerWidget {
  const MarkDoneButton({super.key});

  static const double _size = 44;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final current = ref.watch(scheduleStatusProvider.select((s) => s.current));
    if (current == null) return const SizedBox.shrink();

    final marked = ref.watch(
      trackingControllerProvider.select((ids) => ids.contains(current.id)),
    );

    return Padding(
      // Leading gap lives here so the NowTag stays centred when the button is
      // hidden (Free time renders nothing above, not an empty gap).
      padding: const EdgeInsets.only(left: 12),
      child: Semantics(
        button: true,
        checked: marked,
        label: marked
            ? 'Done: ${current.label}. Tap to undo.'
            : 'Mark done: ${current.label}',
        child: GestureDetector(
          onTap: () {
            HapticFeedback.mediumImpact();
            ref.read(trackingControllerProvider.notifier).toggle(current);
          },
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 220),
            curve: Curves.easeOut,
            width: _size,
            height: _size,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: marked ? AppColors.doneAccent : Colors.transparent,
              border: Border.all(
                color: marked ? AppColors.doneAccent : AppColors.doneIdleBorder,
                width: 2,
              ),
              boxShadow: marked
                  ? [
                      BoxShadow(
                        color: AppColors.doneAccent.withValues(alpha: 0.45),
                        blurRadius: 16,
                        spreadRadius: 1,
                      ),
                    ]
                  : null,
            ),
            child: Icon(
              Icons.check_rounded,
              size: 24,
              color: marked ? Colors.white : AppColors.doneIdleIcon,
            ),
          ),
        ),
      ),
    );
  }
}
