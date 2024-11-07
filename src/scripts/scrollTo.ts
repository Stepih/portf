export const scrollToElementById = (id: string, isBlock:boolean): void => {
  const element = document.getElementById(id);
  
  if (element) {
      // Блокируем прокрутку
      if (isBlock) {
        bodyLock()
      }
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      // Плавный скроллинг к элементу
      window.scrollTo({
          behavior: 'smooth',  // Плавный скроллинг
          top: elementPosition - 50,      // Скролл к началу элемента
      });

      // Используем setTimeout, чтобы подождать завершения скролла
      setTimeout(() => {
        if (isBlock) {
          bodyUnLock()
        }
      }, 1200);
  } else {
      console.warn(`Элемент с id: ${id} не найден.`);
  }
};


export const bodyLock = () => document.body.style.overflow = 'hidden'
export const bodyUnLock = () => document.body.style.overflow = ''