import React, { useEffect } from 'react';

const ScrollComponent = () => {
  useEffect(() => {
    const handleScroll = () => {
      console.log('Прокрутка...');
      // Здесь добавьте вашу логику обработки прокрутки
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return <div>Ваш контент здесь</div>;
};

export default ScrollComponent;
