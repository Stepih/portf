import { Goal, YM_ID } from "@/constants/analytics";

declare global {
  interface Window {
    ym?: (id: number, method: string, ...params: unknown[]) => void;
  }
}

// Вызов Метрики; если скрипт ещё не загружен или заблокирован, ничего не делаем
export const ym = (method: string, ...params: unknown[]) => {
  window.ym?.(YM_ID, method, ...params);
};

// Цель с параметрами: где был клик, какая услуга или кейс (SALES_PLAN 6.1)
export const reachGoal = (goal: Goal, params?: Record<string, string>) => ym('reachGoal', goal, params);
