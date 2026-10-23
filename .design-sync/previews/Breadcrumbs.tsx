import { useState } from 'react';
import { Breadcrumbs } from 'portfolio-ui';

// Mobile-only trail (hidden by `@media (min-width: 560px)`) built from the
// current URL path: "Главная / <segment> / … / <current, bold>".
// The card is neither a phone nor a site route, and package-validate renders at
// 1200px, so each story un-hides the trail with a CSS override (the dist keeps
// readable `<File>_module_<class>` names) and points the address bar at a
// representative route (same document, query kept).
const AtRoute = ({ path }: { path: string }) => {
  useState(() => {
    try { window.history.replaceState(window.history.state, '', path + window.location.search); } catch { /* sandboxed */ }
    return null;
  });
  return (
    <>
      <style>{'.BreadCrumbs_module_nav { display: block !important; }'}</style>
      <Breadcrumbs />
    </>
  );
};

export const SectionPage = () => <AtRoute path="/music" />;

export const NestedPage = () => <AtRoute path="/media/цветокоррекция" />;

// /popup shows its own label "Оставить заявку" (src/data/breadCrumbs.ts), not the raw segment.
export const FormPage = () => <AtRoute path="/popup" />;
