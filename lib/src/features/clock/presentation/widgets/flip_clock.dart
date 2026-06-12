import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_colors.dart';
import '../providers/clock_display_provider.dart';
import 'flip_unit.dart';

/// The hours + minutes flip cards, with the AM/PM meridiem overlaid on the
/// hours card (hidden in 24-hour mode).
class FlipClock extends ConsumerWidget {
  const FlipClock({super.key, required this.cardSize});

  final double cardSize;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final display = ref.watch(clockDisplayProvider);

    return Row(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Stack(
          clipBehavior: Clip.none,
          children: [
            FlipUnit(value: display.hours, size: cardSize),
            if (!display.use24Hour)
              Positioned(
                top: cardSize * 0.075,
                left: cardSize * 0.085,
                child: Text(
                  display.meridiem,
                  style: TextStyle(
                    fontSize: cardSize * 0.085,
                    fontWeight: FontWeight.w700,
                    color: AppColors.digit,
                    letterSpacing: 0.4,
                  ),
                ),
              ),
          ],
        ),
        SizedBox(width: cardSize * 0.09),
        FlipUnit(value: display.minutes, size: cardSize),
      ],
    );
  }
}
