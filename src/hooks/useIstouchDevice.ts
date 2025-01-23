import { useState, useEffect } from "react";

export const useIsTouchDevice = (): boolean => {
  const [isTouch, setIsTouch] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsTouch('ontouchstart' in window && window.innerWidth < 1300);
    }
  }, []);

  return isTouch;
};
