export const scrollToElementById = (id: string): void => {
  const element = document.getElementById(id);
  
  if (element) {
      // Блокируем прокрутку
      document.body.style.overflow = 'hidden'; // Отключаем прокрутку

      // Плавный скроллинг к элементу
      element.scrollIntoView({
          behavior: 'smooth',  // Плавный скроллинг
          block: 'start'       // Скролл к началу элемента
      });

      // Используем setTimeout, чтобы подождать завершения скролла
      setTimeout(() => {
          document.body.style.overflow = ''; // Включаем прокрутку обратно
      }, 500); // Время ожидания, чтобы плавный скролл завершился
  } else {
      console.warn(`Элемент с id: ${id} не найден.`);
  }
};


export const getElementBottomPosition = (element: HTMLElement | null) => {
  if (element) {
    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    return rect.bottom + scrollTop;
  }
  return null; // Если элемент не найден
};
