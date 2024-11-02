import { useEffect, useState } from "react";

const useScrollPosition = () => {
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    const updatePosition = () => {
      setScrollPosition(window.pageYOffset);
    };

    // Добавляем обработчик события
    window.addEventListener("scroll", updatePosition);

    // Устанавливаем начальное значение
    updatePosition();

    // Удаляем обработчик при размонтировании компонента
    return () => window.removeEventListener("scroll", updatePosition);
  }, []);

  return scrollPosition;
};

export default useScrollPosition;
  