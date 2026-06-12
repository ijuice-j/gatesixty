import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/time_formatting.dart';
import '../../domain/entities/schedule_status.dart';
import '../providers/schedule_providers.dart';
import 'free_time_label.dart';

/// The headline pill: the current activity (or "Free"), time remaining and an
/// animated live dot. Tapping it opens the agenda.
class NowTag extends ConsumerWidget {
  const NowTag({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final status = ref.watch(scheduleStatusProvider);
    final current = status.current;
    final accent = current?.color;

    return GestureDetector(
      onTap: () => context.push('/agenda'),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 500),
        curve: Curves.easeOut,
        constraints: const BoxConstraints(minWidth: 220),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          color: accent == null
              ? AppColors.tagSurface
              : accent.withValues(alpha: 0.11),
          border: Border.all(
            color: accent == null
                ? AppColors.tagBorder
                : accent.withValues(alpha: 0.38),
          ),
          boxShadow: const [
            BoxShadow(
              color: Color(0x80000000),
              blurRadius: 20,
              offset: Offset(0, 6),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 12),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              _PulsingDot(
                color: accent ?? AppColors.idleDot,
                live: current != null,
              ),
              const SizedBox(width: 11),
              Flexible(
                child: Text.rich(
                  current == null
                      ? freeTimeLabelSpan(15)
                      : TextSpan(text: current.label),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: AppColors.tagName,
                    fontWeight: FontWeight.w600,
                    fontSize: 15,
                  ),
                ),
              ),
              const SizedBox(width: 11),
              const Text(
                '·',
                style: TextStyle(color: AppColors.tagSeparator),
              ),
              const SizedBox(width: 11),
              _RemainingText(status: status),
            ],
          ),
        ),
      ),
    );
  }
}

/// The `<duration> left` (or "all day") descriptor on the right of the tag.
class _RemainingText extends StatelessWidget {
  const _RemainingText({required this.status});

  final ScheduleStatus status;

  @override
  Widget build(BuildContext context) {
    const base = TextStyle(
      color: AppColors.tagRemaining,
      fontWeight: FontWeight.w500,
      fontFeatures: [FontFeature.tabularFigures()],
    );
    const strong = TextStyle(
      color: AppColors.tagRemainingStrong,
      fontWeight: FontWeight.w600,
      fontFeatures: [FontFeature.tabularFigures()],
    );

    // Free with nothing else on the calendar today.
    if (status.current == null && status.next == null) {
      return const Text('all day', style: base);
    }

    // Active event → time until it ends; free now → time until the next event
    // starts. Both render as "<duration> left", so the free tag shares the
    // active tag's structure. No end time here — that lives in the NEXT pill.
    final minutes = status.current != null
        ? status.remainingMinutes
        : status.minutesUntilNext;
    return Text.rich(
      TextSpan(
        children: [
          TextSpan(text: formatDuration(minutes), style: strong),
          const TextSpan(text: ' left'),
        ],
      ),
      style: base,
    );
  }
}

/// An 8px dot that, when [live], emits an expanding pulse halo (the original
/// `@keyframes pulse`).
class _PulsingDot extends StatefulWidget {
  const _PulsingDot({required this.color, required this.live});

  final Color color;
  final bool live;

  @override
  State<_PulsingDot> createState() => _PulsingDotState();
}

class _PulsingDotState extends State<_PulsingDot>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 2400),
  );

  @override
  void initState() {
    super.initState();
    if (widget.live) _controller.repeat();
  }

  @override
  void didUpdateWidget(covariant _PulsingDot oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.live && !_controller.isAnimating) {
      _controller.repeat();
    } else if (!widget.live && _controller.isAnimating) {
      _controller.stop();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    const dotSize = 8.0;
    return SizedBox(
      width: dotSize,
      height: dotSize,
      child: Stack(
        clipBehavior: Clip.none,
        alignment: Alignment.center,
        children: [
          if (widget.live)
            AnimatedBuilder(
              animation: _controller,
              builder: (context, _) {
                final t = _controller.value;
                // scale 0.6 -> 2.4, opacity 0.55 -> 0 over the first 70%.
                final scale = 0.6 + t * (2.4 - 0.6);
                final opacity = t < 0.7 ? 0.55 * (1 - t / 0.7) : 0.0;
                return Transform.scale(
                  scale: scale,
                  child: Container(
                    width: dotSize + 8,
                    height: dotSize + 8,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: widget.color.withValues(alpha: opacity),
                    ),
                  ),
                );
              },
            ),
          Container(
            width: dotSize,
            height: dotSize,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: widget.color,
            ),
          ),
        ],
      ),
    );
  }
}
