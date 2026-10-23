import { useMediaQuery } from "./useMediaQuery";

// «Уменьшить движение» без расхождения при гидрации (DESIGN_FIXES_PLAN, Д3). useReducedMotion из framer-motion
// на сервере даёт null, а в первом рендере на клиенте уже true – разметка разная, React падает с «Hydration failed».
// Здесь на сервере и в первом рендере false, настоящее значение – сразу после монтирования
export const usePrefersReducedMotion = (): boolean => useMediaQuery('(prefers-reduced-motion: reduce)');
