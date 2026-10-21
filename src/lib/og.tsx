import { CSSProperties, FC } from "react";
import { readFile } from "node:fs/promises";
import path from "node:path";

// Общее для картинок-превью ссылок (opengraph-image, SALES_PLAN 5.6). Картинки собираются при сборке,
// файлы читаются с диска проекта

export const ogSize = { width: 1200, height: 630 };
export const ogContentType = 'image/png';

// Цвета светлой темы (theme.scss): превью видят вне сайта, тёмной темы там нет
export const ogColors = {
    bg: '#ffffff',
    text: '#131313',
    muted: 'rgba(19, 19, 19, 0.55)',
    line: 'rgba(128, 128, 128, 0.3)'
};

const fontsDir = path.join(process.cwd(), 'src/app/fonts');

// Те же файлы, что у next/font/local в fonts.ts. В satori нет кириллицы по умолчанию, шрифты нужны свои
export const ogFonts = async () => {
    const [regular, bold, allerta] = await Promise.all([
        readFile(path.join(fontsDir, 'Raleway-Regular.ttf')),
        readFile(path.join(fontsDir, 'Raleway-Bold.ttf')),
        readFile(path.join(fontsDir, 'AllertaStencil-Regular.ttf'))
    ]);
    return [
        { name: 'Raleway', data: regular, weight: 400 as const, style: 'normal' as const },
        { name: 'Raleway', data: bold, weight: 700 as const, style: 'normal' as const },
        { name: 'Allerta Stencil', data: allerta, weight: 400 as const, style: 'normal' as const }
    ];
}

// Картинка с диска как data URI: путь от корня проекта, для public – '/public/…'
export const ogImage = async (file: string): Promise<string> => {
    const ext = path.extname(file).slice(1).toLowerCase();
    const data = await readFile(path.join(process.cwd(), file));
    return `data:image/${ext === 'jpg' ? 'jpeg' : ext};base64,${data.toString('base64')}`;
}

// Текст без невидимых символов из offer.ts (U+2060 против переноса): в шрифте их нет, satori рисует квадрат
export const ogText = (text: string): string => text.replace(/⁠/g, '');

// Текст, который переносится только по пробелам: satori рвёт строку и после дефиса («ИИ-» / «агенты»),
// а U+2060 против этого ему недоступен. Каждое слово – отдельный блок
export const OgWords: FC<{ text: string, style?: CSSProperties }> = ({ text, style }) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', columnGap: '0.25em', ...style }}>
        {ogText(text).split(' ').map((word, i) => <span key={i}>{word}</span>)}
    </div>
)
