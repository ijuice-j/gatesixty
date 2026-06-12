import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/time_formatting.dart';
import '../../../settings/presentation/settings_controller.dart';
import '../../../../core/time/clock_ticker.dart';
import '../../domain/entities/schedule_event.dart';
import '../providers/schedule_providers.dart';

/// Full-day agenda, shown as a translucent blurred overlay route. Tap the
/// backdrop to dismiss; the current event is highlighted with a NOW badge.
class AgendaScreen extends ConsumerWidget {
  const AgendaScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final eventsAsync = ref.watch(scheduleProvider);
    final use24Hour = ref.watch(settingsProvider.select((s) => s.use24Hour));
    final nowMinute = ref
        .watch(
          clockTickerProvider.select((async) {
            final t = async.value ?? DateTime.now();
            return t.hour * 60 + t.minute;
          }),
        )
        .toDouble();

    // This route has no Scaffold, so provide a (transparent) Material ancestor
    // — without one, Flutter paints debug amber underlines on every Text.
    return Material(
      type: MaterialType.transparency,
      child: GestureDetector(
        onTap: () => context.pop(),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
          child: ColoredBox(
            color: AppColors.agendaScrim,
            child: Center(
            child: GestureDetector(
              onTap: () {}, // absorb taps on the card so they don't dismiss
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  minWidth: 320,
                  maxWidth: 480,
                  maxHeight: MediaQuery.sizeOf(context).height * 0.86,
                ),
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 28,
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      const Padding(
                        padding: EdgeInsets.only(bottom: 18),
                        child: Text(
                          'TODAY',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: AppColors.agendaTitle,
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 2.6,
                          ),
                        ),
                      ),
                      eventsAsync.when(
                        loading: () => const Padding(
                          padding: EdgeInsets.all(24),
                          child: Center(child: CircularProgressIndicator()),
                        ),
                        error: (e, _) => Text(
                          'Could not load schedule:\n$e',
                          style: const TextStyle(color: AppColors.agendaRow),
                        ),
                        data: (events) => _AgendaList(
                          events: events,
                          nowMinute: nowMinute,
                          use24Hour: use24Hour,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
        ),
      ),
    );
  }
}

class _AgendaList extends StatelessWidget {
  const _AgendaList({
    required this.events,
    required this.nowMinute,
    required this.use24Hour,
  });

  final List<ScheduleEvent> events;
  final double nowMinute;
  final bool use24Hour;

  @override
  Widget build(BuildContext context) {
    final sorted = [...events]
      ..sort((a, b) => a.startMinute.compareTo(b.startMinute));

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        for (var i = 0; i < sorted.length; i++)
          _AgendaRow(
            event: sorted[i],
            isCurrent: sorted[i].isActiveAt(nowMinute),
            use24Hour: use24Hour,
            showDivider: i != sorted.length - 1,
          ),
      ],
    );
  }
}

class _AgendaRow extends StatelessWidget {
  const _AgendaRow({
    required this.event,
    required this.isCurrent,
    required this.use24Hour,
    required this.showDivider,
  });

  final ScheduleEvent event;
  final bool isCurrent;
  final bool use24Hour;
  final bool showDivider;

  @override
  Widget build(BuildContext context) {
    final color = isCurrent ? AppColors.agendaRowCurrent : AppColors.agendaRow;
    final range =
        '${formatClock(event.startMinute, use24Hour: use24Hour)} – '
        '${formatClock(event.endMinute, use24Hour: use24Hour)}';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
      decoration: BoxDecoration(
        border: showDivider
            ? const Border(
                bottom: BorderSide(color: AppColors.agendaDivider),
              )
            : null,
      ),
      child: Row(
        children: [
          Container(
            width: 9,
            height: 9,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: event.color,
            ),
          ),
          const SizedBox(width: 14),
          SizedBox(
            width: 150,
            child: Text(
              range,
              style: TextStyle(
                color: color,
                fontSize: 14.5,
                fontFeatures: const [FontFeature.tabularFigures()],
              ),
            ),
          ),
          Expanded(
            child: Text(
              event.label,
              style: TextStyle(
                color: color,
                fontSize: 14.5,
                fontWeight: isCurrent ? FontWeight.w600 : FontWeight.w400,
              ),
            ),
          ),
          if (isCurrent)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(999),
                border: Border.all(color: const Color(0xFF333333)),
              ),
              child: const Text(
                'NOW',
                style: TextStyle(
                  color: Color(0xFFAAAAAA),
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.4,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
