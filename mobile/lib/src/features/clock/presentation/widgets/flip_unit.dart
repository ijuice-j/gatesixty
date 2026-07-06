import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';

/// A single split-flap digit pair (e.g. the hours or minutes card).
///
/// Replicates the original CSS flip: four stacked layers — a static top
/// showing the *new* value, a static bottom showing the *old* value, a top
/// flap that folds down (old value), and a bottom flap that unfolds up (new
/// value). The animation only runs when [value] changes.
class FlipUnit extends StatefulWidget {
  const FlipUnit({super.key, required this.value, required this.size});

  /// The two-character value to display, e.g. `"08"`.
  final String value;

  /// Width == height of the square card, in logical pixels.
  final double size;

  @override
  State<FlipUnit> createState() => _FlipUnitState();
}

class _FlipUnitState extends State<FlipUnit>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 620),
  );

  late String _current = widget.value;
  late String _previous = widget.value;

  @override
  void didUpdateWidget(covariant FlipUnit oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.value != _current) {
      _previous = _current;
      _current = widget.value;
      _controller.forward(from: 0);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = widget.size;
    final radius = size * 0.085;

    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          // Static top: the NEW value's upper half (revealed as the top flap
          // falls away).
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: _CardHalf(
              text: _current,
              isTop: true,
              size: size,
              radius: radius,
            ),
          ),
          // Static bottom: the OLD value's lower half (visible until the
          // bottom flap unfolds over it).
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: _CardHalf(
              text: _previous,
              isTop: false,
              size: size,
              radius: radius,
            ),
          ),
          AnimatedBuilder(
            animation: _controller,
            builder: (context, _) {
              final v = _controller.value;
              // Phase 1 (0 -> 0.5): top flap folds 0 -> -90deg.
              // Phase 2 (0.5 -> 1): bottom flap unfolds 90 -> 0deg.
              final topAngle =
                  v <= 0.5 ? -(v / 0.5) * (math.pi / 2) : -math.pi / 2;
              final bottomAngle =
                  v >= 0.5 ? (1 - (v - 0.5) / 0.5) * (math.pi / 2) : math.pi / 2;
              final topShade = (v <= 0.5 ? v / 0.5 : 1.0) * 0.5;
              final bottomShade = (v >= 0.5 ? 1 - (v - 0.5) / 0.5 : 1.0) * 0.45;

              return Stack(
                clipBehavior: Clip.none,
                children: [
                  // Folding top flap — OLD value, hinged at the bottom edge.
                  Positioned(
                    top: 0,
                    left: 0,
                    right: 0,
                    child: Transform(
                      alignment: Alignment.bottomCenter,
                      transform: Matrix4.identity()
                        ..setEntry(3, 2, 0.0015)
                        ..rotateX(topAngle),
                      child: _CardHalf(
                        text: _previous,
                        isTop: true,
                        size: size,
                        radius: radius,
                        shade: topShade,
                      ),
                    ),
                  ),
                  // Unfolding bottom flap — NEW value, hinged at the top edge.
                  Positioned(
                    bottom: 0,
                    left: 0,
                    right: 0,
                    child: Transform(
                      alignment: Alignment.topCenter,
                      transform: Matrix4.identity()
                        ..setEntry(3, 2, 0.0015)
                        ..rotateX(bottomAngle),
                      child: _CardHalf(
                        text: _current,
                        isTop: false,
                        size: size,
                        radius: radius,
                        shade: bottomShade,
                      ),
                    ),
                  ),
                ],
              );
            },
          ),
          // Center hinge line.
          Positioned(
            top: size / 2 - 0.6,
            left: 0,
            right: 0,
            child: Container(height: 1.2, color: AppColors.hinge),
          ),
        ],
      ),
    );
  }
}

/// One half (top or bottom) of a flip card: a dark gradient panel showing the
/// matching half of a full-height, centered glyph, with an optional dark
/// [shade] overlay used to fake the fold shadow.
class _CardHalf extends StatelessWidget {
  const _CardHalf({
    required this.text,
    required this.isTop,
    required this.size,
    required this.radius,
    this.shade = 0,
  });

  final String text;
  final bool isTop;
  final double size;
  final double radius;
  final double shade;

  @override
  Widget build(BuildContext context) {
    final borderRadius = isTop
        ? BorderRadius.vertical(top: Radius.circular(radius))
        : BorderRadius.vertical(bottom: Radius.circular(radius));

    const topGradient = LinearGradient(
      begin: Alignment.topCenter,
      end: Alignment.bottomCenter,
      colors: [AppColors.cardTop, AppColors.cardTopEnd],
    );
    const bottomGradient = LinearGradient(
      begin: Alignment.topCenter,
      end: Alignment.bottomCenter,
      colors: [AppColors.cardBottomStart, AppColors.cardBottom],
    );

    final digitStyle = TextStyle(
      fontSize: size * 0.82,
      fontWeight: FontWeight.w700,
      color: AppColors.digit,
      height: 1.0,
      // Even leading centers the glyph box on the hinge instead of letting
      // font ascent/descent push it off-center (which makes the two halves
      // look mismatched at the seam).
      leadingDistribution: TextLeadingDistribution.even,
      letterSpacing: size * -0.02,
    );

    return ClipRRect(
      borderRadius: borderRadius,
      child: SizedBox(
        width: size,
        height: size / 2,
        child: Stack(
          children: [
            Positioned.fill(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: isTop ? topGradient : bottomGradient,
                ),
              ),
            ),
            // Show the matching half of the full-height centered glyph.
            // OverflowBox lets the inner card-height digit render at its true
            // `size` and overflow this half-height box; ClipRect then keeps
            // only the top or bottom half. (A plain Align(heightFactor: 0.5)
            // would clamp the child to size/2 and tear the digit at the seam.)
            ClipRect(
              child: OverflowBox(
                minWidth: size,
                maxWidth: size,
                minHeight: size,
                maxHeight: size,
                alignment:
                    isTop ? Alignment.topCenter : Alignment.bottomCenter,
                child: SizedBox(
                  width: size,
                  height: size,
                  child: Center(child: Text(text, style: digitStyle)),
                ),
              ),
            ),
            if (shade > 0)
              Positioned.fill(
                child: ColoredBox(
                  color: Colors.black.withValues(alpha: shade),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
