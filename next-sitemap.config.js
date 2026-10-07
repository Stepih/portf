module.exports = {
    siteUrl: 'https://showmyworks.ru',  // Укажите ваш домен
    generateRobotsTxt: true,           // Опционально: генерировать файл robots.txt
    changefreq: 'daily',               // Частота обновления страницы
    priority: 0.7,                     // Приоритет для страницы
    exclude: ['/popup'],               // Форма заявки — служебная страница, в поиске не нужна
    sitemapSize: 5000,                 // Максимальное количество URL в одном файле sitemap
  };