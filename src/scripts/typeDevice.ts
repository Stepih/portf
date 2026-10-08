// Шире этого порога считаем устройство десктопом, даже если у экрана есть тач
export const TOUCH_MAX_WIDTH = 1300;

// Единственный детектор тача. Вызывать на клиенте: в обработчиках, эффектах или в компонентах,
// которые монтируются только в браузере. В рендере SSR-компонента используй useIsTouchDevice
export const isTouchDevice = (): boolean => {
  if (typeof window === "undefined") return false;
  return 'ontouchstart' in window && window.innerWidth < TOUCH_MAX_WIDTH;
};
