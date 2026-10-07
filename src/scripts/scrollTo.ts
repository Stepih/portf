// Таймер снятия блокировки после плавной прокрутки. Новый вызов отменяет предыдущий.
let scrollUnlockTimer: ReturnType<typeof setTimeout> | undefined;
let releaseScrollLock: (() => void) | undefined;

export const scrollToElementById = (id: string, isBlock:boolean): void => {
  const element = document.getElementById(id);
  
  if (element) {
      // Блокируем прокрутку на время плавного скролла
      if (isBlock) {
        clearTimeout(scrollUnlockTimer);
        releaseScrollLock ??= lockBodyScroll();
      }
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      // Плавный скроллинг к элементу
      window.scrollTo({
          behavior: 'smooth',  // Плавный скроллинг
          top: elementPosition - 50,      // Скролл к началу элемента
      });

      // Ждём завершения скролла и снимаем блокировку
      if (isBlock) {
        scrollUnlockTimer = setTimeout(() => {
          releaseScrollLock?.();
          releaseScrollLock = undefined;
        }, 1200);
      }
  } else {
      console.warn(`Элемент с id: ${id} не найден.`);
  }
};

export const getWidthScroll = () => {
  return window.innerWidth - document.body.offsetWidth + 'px'
}

// Число активных блокировок. Стили body снимаются, только когда отпущены все.
let lockCount = 0;

// Блокирует прокрутку body и возвращает функцию снятия (повторный вызов ничего не делает).
// В компонентах используй хук useBodyScrollLock: он снимает блокировку при размонтировании.
export const lockBodyScroll = (): (() => void) => {
  const body = document.body;

  if (lockCount === 0) {
    const lockPaddingValue = window.innerWidth - body.offsetWidth;
    body.style.paddingRight = lockPaddingValue + 'px';
    body.style.overflow = 'hidden';
  }
  lockCount++;

  let released = false;
  return () => {
    if (released) return;
    released = true;
    lockCount--;
    if (lockCount === 0) {
      body.style.paddingRight = '';
      body.style.overflow = '';
    }
  };
}
