// Stand-in for next/image outside Next.js: a plain <img>. `fill` mirrors
// next/image's absolute-fill styling; static imports ({src}) unwrap.
import { forwardRef, ImgHTMLAttributes, CSSProperties } from 'react';

type Src = string | { src: string; width?: number; height?: number };
type ImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src: Src;
  fill?: boolean;
  priority?: boolean;
  quality?: number;
  placeholder?: string;
  blurDataURL?: string;
  unoptimized?: boolean;
  loader?: unknown;
};

const Image = forwardRef<HTMLImageElement, ImageProps>(function Image(
  { src, fill, priority, quality, placeholder, blurDataURL, unoptimized, loader, style, width, height, ...rest },
  ref,
) {
  const s = typeof src === 'string' ? { src } : src;
  const fillStyle: CSSProperties = fill
    ? { position: 'absolute', inset: 0, width: '100%', height: '100%' }
    : {};
  return (
    <img
      ref={ref}
      src={s.src}
      width={fill ? undefined : width ?? (typeof src === 'object' ? src.width : undefined)}
      height={fill ? undefined : height ?? (typeof src === 'object' ? src.height : undefined)}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      style={{ ...fillStyle, ...style }}
      {...rest}
    />
  );
});

export default Image;
