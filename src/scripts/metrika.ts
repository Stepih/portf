import { Goal, YM_HOST, YM_ID } from "@/constants/analytics";

declare global {
  interface Window {
    ym?: (id: number, method: string, ...params: unknown[]) => void;
  }
}

// Хост, на котором работает Метрика: прод и www (на своём сервере nginx уводит www на основной домен, на Vercel – как настроен
// домен). localhost, превью Vercel, sslip.io и проверочные сборки – без счётчика, чтобы не засорять данные (Д54)
export const isMetrikaHost = (hostname: string) => {
  const host = hostname.toLowerCase().replace(/\.$/, '');
  return host === YM_HOST || host === `www.${YM_HOST}`;
};

// Вызов Метрики. window.ym появляется только от загрузчика tag.js, а его YandexMetrika ставит лишь на isMetrikaHost,
// поэтому на прочих хостах вызов – пустой. Если скрипт ещё не загружен или заблокирован, тоже ничего не делаем
export const ym = (method: string, ...params: unknown[]) => {
  window.ym?.(YM_ID, method, ...params);
};

// Цель с параметрами: где был клик, какая услуга или кейс (SALES_PLAN 6.1)
export const reachGoal = (goal: Goal, params?: Record<string, string>) => ym('reachGoal', goal, params);
