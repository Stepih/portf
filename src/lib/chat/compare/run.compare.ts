// Сравнение моделей демо-чата на типовых вопросах (CONVERSION_PLAN К3.2). ТРАТИТ ДЕНЬГИ с ключа BotHub:
// запускать только с разрешения владельца. Запуск:
//   CHAT_COMPARE=1 CHAT_COMPARE_MODELS=claude-haiku-5.5 npx vitest run --config vitest.compare.config.ts
// CHAT_COMPARE_MODELS – через запятую, без него – все модели из списка ниже.
// Результат – .chat-compare/<дата>/: промпт каждой модели, report.md и usage.json (папка в .gitignore)

import { mkdirSync, writeFileSync } from "fs";
import { expect, it } from "vitest";
import { chatReplyWithUsage } from "../model";
import { buildSystemPrompt } from "../prompt";
import { answerProblems } from "./checks";
import { compareQuestions } from "./questions";

// Модели и цены BotHub, ₽ за 1 млн токенов вход / выход (каталог на 22.10.2026, выбор владельца)
const allModels = [
    { id: 'claude-haiku-5.5', input: 9.88, output: 49.40 },
    { id: 'gpt-4.1-mini', input: 17.57, output: 70.26 },
];

const picked = process.env.CHAT_COMPARE_MODELS?.split(',').map((id) => id.trim());
const models = picked ? allModels.filter((m) => picked.includes(m.id)) : allModels;

const cell = (text: string) => text.replace(/\|/g, '\\|').replace(/\n+/g, '<br>');
const rub = (n: number) => n.toFixed(2).replace('.', ',');

it.runIf(process.env.CHAT_COMPARE === '1')('сравнение моделей', { timeout: 30 * 60 * 1000 }, async () => {
    expect(process.env.BOTHUB_API_KEY, 'нет BOTHUB_API_KEY в .env.local').toBeTruthy();
    expect(models.length, `нет моделей из CHAT_COMPARE_MODELS=${process.env.CHAT_COMPARE_MODELS}`).toBeGreaterThan(0);

    const system = buildSystemPrompt();
    const stamp = new Date().toISOString().slice(0, 16).replace(/:/g, '-');
    const dir = `.chat-compare/${stamp}`;
    mkdirSync(dir, { recursive: true });

    // Промпт каждой модели – в файл до первого запроса: видно, с чем именно она отвечала.
    // Инструментов (tools) и поиска в запросе нет, модель видит только этот текст и вопрос
    for (const model of models) writeFileSync(`${dir}/prompt-${model.id}.txt`, system);

    const rows: string[] = [];
    const usageLog: unknown[] = [];
    const totals = models.map(() => ({ cost: 0, ms: 0, problems: 0, errors: 0, cached: 0, reasoning: 0, truncated: 0 }));
    // Кэш промпта пробуем у каждой модели. Не принял BotHub маркер (ошибка на первом вопросе) – повтор без него
    const cacheOn = models.map(() => true);
    const notes: string[] = [];

    // По очереди, без параллели: видно время ответа, кэш успевает записаться, а при ошибке ключа тратится один запрос
    for (const [qi, q] of compareQuestions.entries()) {
        const answers: string[] = [];
        for (const [mi, model] of models.entries()) {
            const ask = () => chatReplyWithUsage(system, [{ role: 'user', content: q.question }], model.id, cacheOn[mi]);
            const started = Date.now();
            try {
                let r;
                try {
                    r = await ask();
                } catch (error) {
                    if (qi !== 0 || !cacheOn[mi]) throw error;
                    cacheOn[mi] = false;
                    notes.push(`${model.id}: маркер кэша не принят (${String(error)}), прогон без кэша`);
                    r = await ask();
                }
                const ms = Date.now() - started;
                // Цена без скидки за кэш: тариф BotHub на кэш неизвестен, экономию видно по cachedTokens и балансу
                const cost = (r.inputTokens * model.input + r.outputTokens * model.output) / 1e6;
                const problems = [
                    ...answerProblems(r.text, system),
                    r.finishReason === 'length' && 'обрезан по max_tokens',
                ].filter((p): p is string => Boolean(p));
                const t = totals[mi];
                t.cost += cost;
                t.ms += ms;
                t.problems += problems.length ? 1 : 0;
                t.cached += r.cachedTokens;
                t.reasoning += r.reasoningTokens;
                t.truncated += r.finishReason === 'length' ? 1 : 0;
                usageLog.push({ question: qi + 1, model: model.id, finishReason: r.finishReason, usage: r.usage });

                const stats = [
                    `${(ms / 1000).toFixed(1)} с`,
                    `${r.inputTokens}+${r.outputTokens} ток.`,
                    r.cachedTokens && `из кэша ${r.cachedTokens}`,
                    r.reasoningTokens && `рассуждения ${r.reasoningTokens}`,
                    `${rub(cost)} ₽`,
                ].filter(Boolean).join(' · ');
                answers.push(`${cell(r.text)}<br>*${stats}*${problems.length ? `<br>⚠ ${problems.join(', ')}` : ''}`);
            } catch (error) {
                totals[mi].errors++;
                answers.push(`❌ ${cell(String(error))}`);
                // Ключ не подходит или деньги кончились – дальше не идём
                if (qi === 0) throw error;
            }
        }
        rows.push(`| ${qi + 1}. ${cell(q.question)}<br>*Ждём: ${cell(q.expect)}* | ${answers.join(' | ')} |`);
        console.log(`${qi + 1}/${compareQuestions.length}`);
    }

    const summary = models.map((m, i) => {
        const t = totals[i];
        return `| ${m.id} | ${rub(t.cost)} ₽ | ${(t.ms / compareQuestions.length / 1000).toFixed(1)} с | ${t.problems} | ${t.errors} | ${cacheOn[i] ? t.cached : 'выкл.'} | ${t.reasoning} | ${t.truncated} |`;
    });

    const report = [
        `# Сравнение моделей демо-чата, ${new Date().toLocaleString('ru-RU')}`,
        '',
        '| Модель | Всего (без скидки за кэш) | Среднее время | Ответов с ⚠ | Ошибок | Токенов из кэша | Токенов рассуждений | Обрезано |',
        '|---|---|---|---|---|---|---|---|',
        ...summary,
        ...(notes.length ? ['', ...notes.map((n) => `- ${n}`)] : []),
        '',
        `| Вопрос | ${models.map((m) => m.id).join(' | ')} |`,
        `|---|${models.map(() => '---').join('|')}|`,
        ...rows,
    ].join('\n');

    writeFileSync(`${dir}/report.md`, report);
    writeFileSync(`${dir}/usage.json`, JSON.stringify(usageLog, null, 2));
    console.log(`Готово: ${dir}/report.md\n${summary.join('\n')}\n${notes.join('\n')}`);
});
