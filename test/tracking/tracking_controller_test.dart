import 'dart:ui';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:gate60/src/features/schedule/domain/entities/schedule_event.dart';
import 'package:gate60/src/features/tracking/presentation/providers/tracking_providers.dart';

ScheduleEvent _event(String id) => ScheduleEvent(
      id: id,
      name: 'Workout',
      emoji: '',
      color: const Color(0xFF4E9466),
      startMinute: 540,
      endMinute: 600,
    );

void main() {
  // The controller listens to scheduleStatusProvider, which returns an empty
  // status while signed out (no Google calls), so a bare container is enough to
  // exercise the toggle/reflect behaviour.
  ProviderContainer makeContainer() {
    final container = ProviderContainer();
    addTearDown(container.dispose);
    return container;
  }

  test('toggle marks and unmarks an event', () {
    final container = makeContainer();
    final controller = container.read(trackingControllerProvider.notifier);
    final event = _event('e1');

    expect(controller.isMarked(event), isFalse);

    controller.toggle(event);
    expect(controller.isMarked(event), isTrue);
    expect(container.read(trackingControllerProvider), contains('e1'));

    controller.toggle(event);
    expect(controller.isMarked(event), isFalse);
    expect(container.read(trackingControllerProvider), isNot(contains('e1')));
  });

  test('intent is tracked per event id independently', () {
    final container = makeContainer();
    final controller = container.read(trackingControllerProvider.notifier);

    controller.toggle(_event('a'));
    expect(controller.isMarked(_event('a')), isTrue);
    expect(controller.isMarked(_event('b')), isFalse);
  });
}
