// Сравнение моделей демо-чата на типовых вопросах (CONVERSION_PLAN К3.2). ТРАТИТ ДЕНЬГИ с ключа BotHub:
// запускать только с разрешения владельца. Запуск: CHAT_COMPARE=1 npx vitest run --config vitest.compare.config.ts
// Результат – .chat-compare/<дата>.md (папка в .gitignore)

import { mkdirSync, writeFileSync } from "fs";
import { expect, it } from "vitest";
import { chatReplyWithUsage } from "../model";
import { buildSystemPrompt } from "../prompt";
import { answerProblems } from "./checks";
import { compareQuestions } from "./questions";

// Модели и цены BotHub, ₽ за 1 млн токенов вход / выход (каталог на 22.10.2026, выбор владельца)
const models = [
    { id: 'claude-haiku-5.5', input: 9.88, output: 49.40 },
    { id: 'gpt-4.1-mini', input: 17.57, output: 70.26 },
];

const cell = (text: string) => text.replace(/\|/g, '\\|').replace(/\n+/g, '<br>');
const rub = (n: number) => n.toFixed(2).replace('.', ',');

it.runIf(process.env.CHAT_COMPARE === '1')('сравнение моделей', { timeout: 30 * 60 * 1000 }, async () => {
    expect(process.env.BOTHUB_API_KEY, 'нет BOTHUB_API_KEY в .env.local').toBeTruthy();

    const system = buildSystemPrompt();
    const rows: string[] = [];
    const totals = models.map(() => ({ cost: 0, ms: 0, problems: 0, errors: 0 }));

    // По очереди, без параллели: видно время ответа, и при ошибке ключа тратится не больше одного запроса
    for (const [qi, q] of compareQuestions.entries()) {
        const answers: string[] = [];
        for (const [mi, model] of models.entries()) {
            const started = Date.now();
            try {
                const r = await chatReplyWithUsage(system, [{ role: 'user', content: q.question }], model.id);
                const ms = Date.now() - started;
                const cost = (r.inputTokens * model.input + r.outputTokens * model.output) / 1e6;
                const problems = answerProblems(r.text, system);
                Object.assign(totals[mi], {
                    cost: totals[mi].cost + cost,
                    ms: totals[mi].ms + ms,
                    problems: totals[mi].problems + (problems.length ? 1 : 0),
                });
                answers.push(`${cell(r.text)}<br>*${(ms / 1000).toFixed(1)} с · ${r.inputTokens}+${r.outputTokens} ток. · ${rub(cost)} ₽*${problems.length ? `<br>⚠ ${problems.join(', ')}` : ''}`);
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

    const summary = models.map((m, i) =>
        `| ${m.id} | ${rub(totals[i].cost)} ₽ | ${(totals[i].ms / compareQuestions.length / 1000).toFixed(1)} с | ${totals[i].problems} | ${totals[i].errors} |`
    );

    const report = [
        `# Сравнение моделей демо-чата, ${new Date().toLocaleString('ru-RU')}`,
        '',
        '| Модель | Всего | Среднее время | Ответов с ⚠ | Ошибок |',
        '|---|---|---|---|---|',
        ...summary,
        '',
        `| Вопрос | ${models.map((m) => m.id).join(' | ')} |`,
        `|---|${models.map(() => '---').join('|')}|`,
        ...rows,
    ].join('\n');

    mkdirSync('.chat-compare', { recursive: true });
    const file = `.chat-compare/${new Date().toISOString().slice(0, 16).replace(/:/g, '-')}.md`;
    writeFileSync(file, report);
    console.log(`Готово: ${file}\n${summary.join('\n')}`);
});
