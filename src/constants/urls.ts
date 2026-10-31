export const myTg = "https://t.me/polo_ymniy"
export const myInst = "#"
export const portfolioTg = "https://t.me/+V9a95MHP3ds3YTky"

export const musicPageURL = "/music"
export const popupPageURL = "/popup"
export const mediaPageURL = "/media"
export const portfolioPageURL = "/portfolio"
export const aiPageURL = "/ai"

// Форма заявки на главной (DESIGN_FIXES_3_PLAN Д13): призывы главной ведут сюда, а не на /popup
export const contactSectionId = "contact"
export const contactTitleId = "contact-title"

// Временно скрытые страницы: отвечают 404, ссылки на них убраны.
// Чтобы вернуть страницу, убери её отсюда и из exclude в next-sitemap.config.js
export const hiddenPages: string[] = [musicPageURL, mediaPageURL]
