import { YM_ID } from "@/constants/analytics";

declare global {
  interface Window {
    ym?: (id: number, method: string, ...params: unknown[]) => void;
  }
}

// Вызов Метрики; если скрипт ещё не загружен или заблокирован, ничего не делаем
export const ym = (method: string, ...params: unknown[]) => {
  window.ym?.(YM_ID, method, ...params);
};

export const reachGoal = (goal: string) => ym('reachGoal', goal);
