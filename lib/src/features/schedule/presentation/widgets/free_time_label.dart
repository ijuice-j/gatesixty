import 'package:flutter/widgets.dart';
import 'package:flutter_svg/flutter_svg.dart';

/// The bundled Microsoft Fluent Emoji confetti (the Windows 11 / Segoe UI Emoji
/// look). Bundled as an asset so it renders identically on every device instead
/// of falling back to each platform's own emoji font.
const _confettiAsset = 'assets/emoji/party_popper.svg';

/// An inline "Free time 🎉" span, with the confetti drawn from [_confettiAsset]
/// sized to sit on a [fontSize] text line. The leading text inherits the
/// surrounding [Text.rich] style.
InlineSpan freeTimeLabelSpan(double fontSize) {
  return TextSpan(
    children: [
      const TextSpan(text: 'Free time '),
      WidgetSpan(
        alignment: PlaceholderAlignment.middle,
        child: SvgPicture.asset(
          _confettiAsset,
          width: fontSize * 1.2,
          height: fontSize * 1.2,
        ),
      ),
    ],
  );
}
