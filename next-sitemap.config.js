module.exports = {
    siteUrl: 'https://showmyworks.ru',  // Укажите ваш домен
    generateRobotsTxt: true,           // Опционально: генерировать файл robots.txt
    changefreq: 'daily',               // Частота обновления страницы
    priority: 0.7,                     // Приоритет для страницы
    // Форма заявки — служебная страница, в поиске не нужна; /music и /media временно скрыты (hiddenPages в src/constants/urls.ts); /ai и /sites – до команды владельца после финальной проверки (SERVICES_PLAN У4, У5)
    exclude: ['/popup', '/music', '/media', '/ai', '/ai/opengraph-image', '/sites', '/sites/opengraph-image'],
    sitemapSize: 5000,                 // Максимальное количество URL в одном файле sitemap
  };