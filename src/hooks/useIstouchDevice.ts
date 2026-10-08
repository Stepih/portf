import { useState, useEffect } from "react";
import { isTouchDevice } from "@/scripts/typeDevice";

// На сервере и в первом рендере false, после монтирования — реальное значение: так нет расхождения при гидрации
export const useIsTouchDevice = (): boolean => {
  const [isTouch, setIsTouch] = useState<boolean>(false);

  useEffect(() => {
    setIsTouch(isTouchDevice());
  }, []);

  return isTouch;
};
