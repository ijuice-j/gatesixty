import 'dart:ui';

import 'package:flutter_test/flutter_test.dart';
import 'package:gate60/src/core/utils/color_utils.dart';

void main() {
  group('hexFromColor', () {
    test('maps common colours to #RRGGBB (alpha ignored)', () {
      expect(hexFromColor(const Color(0xFF7B81C9)), '#7B81C9');
      expect(hexFromColor(const Color(0xFF4E9466)), '#4E9466');
      expect(hexFromColor(const Color(0xFF000000)), '#000000');
      expect(hexFromColor(const Color(0xFFFFFFFF)), '#FFFFFF');
    });

    test('ignores the alpha channel', () {
      expect(hexFromColor(const Color(0x807B81C9)), '#7B81C9');
    });
  });
}
