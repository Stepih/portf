import { useState } from 'react';
import { Breadcrumbs } from 'portfolio-ui';

// Mobile-only trail (renders nothing at window widths >= 560px) built from the
// current URL path: "Главная / <segment> / … / <current, bold>".
// The card is neither a phone nor a site route, so each story first presents a
// phone-width window and points the address bar at a representative route
// (same document, query kept).
const AtRoute = ({ path }: { path: string }) => {
  useState(() => {
    try { Object.defineProperty(window, 'innerWidth', { configurable: true, get: () => 390 }); } catch { /* locked */ }
    try { window.history.replaceState(window.history.state, '', path + window.location.search); } catch { /* sandboxed */ }
    return null;
  });
  return <Breadcrumbs />;
};

export const SectionPage = () => <AtRoute path="/music" />;

export const NestedPage = () => <AtRoute path="/media/цветокоррекция" />;
