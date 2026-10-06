// Stand-in for next/link outside Next.js: a plain <a>.
import { forwardRef, AnchorHTMLAttributes } from 'react';

type Href = string | { pathname?: string; hash?: string; query?: Record<string, string> };
type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  href: Href;
  passHref?: boolean;
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
  shallow?: boolean;
  locale?: string | false;
  legacyBehavior?: boolean;
};

const toHref = (h: Href) =>
  typeof h === 'string' ? h : `${h.pathname ?? ''}${h.query ? '?' + new URLSearchParams(h.query) : ''}${h.hash ?? ''}`;

const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { href, passHref, prefetch, replace, scroll, shallow, locale, legacyBehavior, ...rest },
  ref,
) {
  return <a ref={ref} href={toHref(href)} {...rest} />;
});

export default Link;
