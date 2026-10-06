// Stand-in for next/navigation outside Next.js: reads window.location,
// router methods navigate with plain location APIs.
const loc = () => (typeof window === 'undefined' ? null : window.location);

export function usePathname(): string {
  return loc()?.pathname ?? '/';
}

export function useSearchParams(): URLSearchParams {
  return new URLSearchParams(loc()?.search ?? '');
}

export function useParams(): Record<string, string> {
  return {};
}

export function useRouter() {
  return {
    push: (href: string) => { const l = loc(); if (l) l.href = href; },
    replace: (href: string) => { loc()?.replace(href); },
    back: () => { if (typeof window !== 'undefined') window.history.back(); },
    forward: () => { if (typeof window !== 'undefined') window.history.forward(); },
    refresh: () => {},
    prefetch: () => {},
  };
}

export function redirect(href: string): never {
  loc()?.replace(href);
  throw new Error(`redirect(${href})`);
}

export function notFound(): never {
  throw new Error('notFound()');
}
