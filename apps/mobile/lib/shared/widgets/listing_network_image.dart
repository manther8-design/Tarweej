import 'package:flutter/material.dart';
import 'package:tarweej_mobile/core/theme/tarweej_colors.dart';
import 'package:tarweej_mobile/shared/utils/media_url.dart';

class ListingNetworkImage extends StatelessWidget {
  const ListingNetworkImage({
    super.key,
    required this.url,
    this.fit = BoxFit.cover,
    this.borderRadius,
    this.height,
    this.width,
  });

  final String? url;
  final BoxFit fit;
  final BorderRadius? borderRadius;
  final double? height;
  final double? width;

  @override
  Widget build(BuildContext context) {
    final resolved = resolveMediaUrl(url);
    final radius = borderRadius ?? BorderRadius.circular(16);
    Widget child;
    if (resolved == null) {
      child = const _ImagePlaceholder();
    } else {
      child = Image.network(
        resolved,
        fit: fit,
        width: width,
        height: height,
        filterQuality: FilterQuality.medium,
        errorBuilder: (_, __, ___) => const _ImagePlaceholder(failed: true),
        loadingBuilder: (context, image, progress) {
          if (progress == null) {
            return image;
          }
          return const _ImagePlaceholder(loading: true);
        },
      );
    }

    return ClipRRect(
      borderRadius: radius,
      child: SizedBox(
        width: width,
        height: height,
        child: child,
      ),
    );
  }
}

class _ImagePlaceholder extends StatelessWidget {
  const _ImagePlaceholder({this.loading = false, this.failed = false});

  final bool loading;
  final bool failed;

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: TarweejColors.inkSoft.withValues(alpha: 0.08),
      child: Center(
        child: loading
            ? const SizedBox(
                width: 22,
                height: 22,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            : Icon(
                failed ? Icons.broken_image_outlined : Icons.image_outlined,
                color: TarweejColors.muted,
                size: 32,
              ),
      ),
    );
  }
}
