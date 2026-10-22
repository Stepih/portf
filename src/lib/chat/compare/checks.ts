// Автопроверки ответа при сравнении моделей: ловят нарушения правил промпта. Смысл ответа проверяет человек

// Суммы в рублях: «8 000 ₽», «30000 ₽», «15 000 рублей»
const prices = (text: string) =>
    [...text.matchAll(/(\d[\d\s ]*\d|\d)\s*(?:₽|руб)/g)].map((m) => m[1].replace(/[\s ]/g, ''));

export const answerProblems = (answer: string, prompt: string): string[] => {
    const known = new Set(prices(prompt));
    const sentences = answer.split(/[.!?…]+(?:\s|$)/).filter((s) => s.trim()).length;

    return [
        !answer.trim() && 'пустой ответ',
        answer.includes('—') && 'длинное тире',
        /\*\*|^#|^\s*[-*] |\|.*\|/m.test(answer) && 'Markdown',
        /https?:\/\/|t\.me\/|www\./.test(answer) && 'ссылка',
        sentences > 5 && `длинный: ${sentences} предложений`,
        ...prices(answer).filter((p) => !known.has(p)).map((p) => `цена не из базы: ${p} ₽`),
    ].filter((p): p is string => Boolean(p));
};
