// Бесплатные проверки запроса к демо-чату до лимитов и модели (CONVERSION_PLAN К3.2)

// Запрос пришёл со страниц этого же сайта. Браузер всегда ставит Origin у POST-запроса, а скрипт мимо сайта –
// обычно нет. Подделать его скрипт может, но так отсекаются чужие сайты, которые дёргают наш API из браузеров посетителей
export const isSameOrigin = (req: Request): boolean => {
    const origin = req.headers.get('origin');
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
    if (!origin || !host) return false;
    try {
        return new URL(origin).host === host;
    } catch {
        return false;
    }
};

// Мусор, на который не стоит тратить запрос к модели: нет ни одной буквы, одна буква подряд 15 раз и больше
// («аааааа…»), три ссылки и больше (спам). Одна ссылка – нормально: клиент может прислать адрес своего сайта
export const isGarbage = (text: string): boolean =>
    !/[a-zа-яё]/i.test(text) ||
    /(.)\1{14,}/u.test(text) ||
    (text.match(/https?:\/\/|www\./gi)?.length ?? 0) >= 3;
