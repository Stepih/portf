module.exports = {
    siteUrl: 'https://showmyworks.ru',  // Укажите ваш домен
    generateRobotsTxt: true,           // Опционально: генерировать файл robots.txt
    changefreq: 'daily',               // Частота обновления страницы
    priority: 0.7,                     // Приоритет для страницы
    // Форма заявки — служебная страница, в поиске не нужна; /music и /media временно скрыты (hiddenPages в src/constants/urls.ts); /lab – черновики анимаций
    exclude: ['/popup', '/music', '/media', '/lab/*'],
    sitemapSize: 5000,                 // Максимальное количество URL в одном файле sitemap
  };