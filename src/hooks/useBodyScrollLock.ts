import { useEffect } from "react";
import { lockBodyScroll } from "@/scripts/scrollTo";

// Блокирует прокрутку body, пока active === true. Снимает блокировку при размонтировании.
export const useBodyScrollLock = (active: boolean): void => {
  useEffect(() => {
    if (!active) return;
    return lockBodyScroll();
  }, [active]);
};
