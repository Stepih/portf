// Автопроверки ответа при сравнении моделей: ловят нарушения правил промпта. Смысл ответа проверяет человек

// Суммы в рублях: «8 000 ₽», «30000 ₽», «15 000 рублей». prefix – есть ли перед суммой «от»
const prices = (text: string) =>
    [...text.matchAll(/(от\s|from\s)?(\d[\d\s ]*\d|\d)\s*(?:₽|руб)/g)].map((m) => ({
        value: m[2].replace(/[\s ]/g, ''),
        withFrom: Boolean(m[1]),
    }));

// \b в JS не работает с кириллицей, поэтому границы слова – через просмотр соседних букв
const word = (words: string) => new RegExp(`(?<![а-яё])(?:${words})(?![а-яё])`, 'i');

const firstPerson = word('сделаю|нарисую|запрограммирую|перезвоню|позвоню|свяжусь|передам|запишу|у меня|мои работы|мы делаем');
const meta = word('баз[аеуы] знаний|правил[ао]?|инструкци[яиюй]|промпт[ауе]?|сведени[яй]');
const modelName = /chatgpt|gpt|openai|claude|anthropic|haiku/i;

export const answerProblems = (answer: string, prompt: string): string[] => {
    const known = new Set(prices(prompt).map((p) => p.value));
    const sentences = answer.split(/[.!?…]+(?:\s|$)/).filter((s) => s.trim()).length;
    const found = prices(answer);

    return [
        !answer.trim() && 'пустой ответ',
        answer.includes('—') && 'длинное тире',
        /\*\*|^#|^\s*[-*] |\|.*\|/m.test(answer) && 'Markdown',
        /https?:\/\/|t\.me\/|www\.|\/portfolio/.test(answer) && 'ссылка',
        sentences > 5 && `длинный: ${sentences} предложений`,
        firstPerson.test(answer) && 'от лица Степана',
        meta.test(answer) && 'упоминает правила или базу',
        modelName.test(answer) && 'называет модель',
        ...found.filter((p) => !known.has(p.value)).map((p) => `цена не из базы: ${p.value} ₽`),
        ...found.filter((p) => known.has(p.value) && !p.withFrom).map((p) => `цена без «от»: ${p.value} ₽`),
    ].filter((p): p is string => Boolean(p));
};
