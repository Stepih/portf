"use client";

import { FC, Suspense, useEffect, useRef } from "react";
import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";

import { YM_ID } from "@/constants/analytics";
import { reachGoal, ym } from "@/scripts/metrika";
import { linkGoal } from "@/scripts/metrikaGoals";

const initParams = { clickmap: true, trackLinks: true, accurateTrackBounce: true };

// Отправляет hit на каждый клиентский переход. Первый hit отправляет сам init
const RouteTracker: FC = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const prevUrl = useRef<string | null>(null);

  useEffect(() => {
    const url = window.location.href;
    if (prevUrl.current === null) {
      prevUrl.current = url;
      return;
    }
    if (prevUrl.current === url) return;

    ym('hit', url, { referer: prevUrl.current });
    prevUrl.current = url;
  }, [pathname, searchParams]);

  return null;
};

// Цели по кликам (SALES_PLAN 6.1): один слушатель на документ вместо onClick в каждом блоке,
// поэтому кнопки в серверных компонентах остаются серверными. Что считать – решает linkGoal
const GoalTracker: FC = () => {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element | null)?.closest?.<HTMLAnchorElement>('a[href]');
      if (!link) return;

      const result = linkGoal({
        href: link.href,
        origin: window.location.origin,
        page: window.location.pathname,
        goal: link.dataset.goal,
        id: link.dataset.goalId,
        place: link.closest<HTMLElement>('[data-goal-place]')?.dataset.goalPlace
      });
      if (result) reachGoal(result.goal, result.params);
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  return null;
};

// Подключается один раз в layout.tsx: template.tsx перемонтируется на каждой навигации
const YandexMetrika: FC = () => (
  <>
    <Script id="yandex-metrika" strategy="afterInteractive">
      {`(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
      m[i].l=1*new Date();
      for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
      k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
      (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
      ym(${YM_ID}, "init", ${JSON.stringify(initParams)});`}
    </Script>
    <noscript>
      <img src={`https://mc.yandex.ru/watch/${YM_ID}`} style={{ position: 'absolute', left: '-9999px' }} alt="" />
    </noscript>
    <Suspense fallback={null}>
      <RouteTracker />
    </Suspense>
    <GoalTracker />
  </>
);

export default YandexMetrika;
