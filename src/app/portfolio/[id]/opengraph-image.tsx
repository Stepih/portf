import { ImageResponse } from "next/og";

import { offerTitle } from "@/data/offer";
import { portfolioWorks } from "@/data/portfolio";
import { portfolioCases } from "@/data/portfolioCases";
import { OgWords, ogColors, ogContentType, ogFonts, ogImage, ogSize, ogText } from "@/lib/og";

interface IProps {
    params: Promise<{ id: string }>
}

// Превью ссылки на кейс (SALES_PLAN 5.6): название, вид работы и скриншот сайта в рамке браузера.
// Владелец шлёт кейсы клиентам в мессенджеры – по картинке видно, что за работа
export const size = ogSize;
export const contentType = ogContentType;
export const alt = 'Кейс из портфолио Степана Картузова';

// Те же адреса, что у страниц кейсов: картинки собираются при сборке
export const generateStaticParams = () =>
    portfolioWorks.filter((work) => portfolioCases[work.id]).map((work) => ({ id: work.id }));

// Окно со скриншотом
const SHOT_WIDTH = 560;
const SHOT_HEIGHT = 470;

const OpengraphImage = async ({ params }: IProps) => {
    const { id } = await params;
    const work = portfolioWorks.find((w) => w.id === id);
    const data = portfolioCases[id];
    if (!work || !data) return new Response('Not found', { status: 404 });

    const shot = await ogImage(`public${work.cover}`);

    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 56,
                    padding: '0 64px 0 72px',
                    fontFamily: 'Raleway',
                    color: ogColors.text,
                    backgroundColor: ogColors.bg,
                    backgroundImage: `radial-gradient(circle at 78% 50%, ${work.tint}, transparent 55%)`
                }}
            >
                <div style={{ flex: 1, height: 470, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                        <div style={{ fontSize: 26, color: ogColors.muted }}>{`Кейс · ${work.year}`}</div>
                        <div style={{ fontSize: 60, fontWeight: 700, lineHeight: 1.05 }}>{work.name}</div>
                        <div style={{ fontSize: 30, lineHeight: 1.3, color: ogColors.muted }}>{ogText(data.kind)}</div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ width: 64, height: 6, borderRadius: 3, background: data.accent }} />
                        <div style={{ fontSize: 26, fontWeight: 700 }}>Степан Картузов</div>
                        <OgWords text={offerTitle} style={{ fontSize: 22, color: ogColors.muted }} />
                    </div>
                </div>

                <div
                    style={{
                        width: SHOT_WIDTH,
                        height: SHOT_HEIGHT,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        borderRadius: 16,
                        background: '#ffffff',
                        border: `1px solid ${ogColors.line}`,
                        boxShadow: '0 20px 50px rgba(19, 19, 19, 0.18)'
                    }}
                >
                    <div style={{ height: 34, flex: 'none', display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', borderBottom: `1px solid ${ogColors.line}` }}>
                        {['#EA7777', '#d0d0d0', '#d0d0d0'].map((color, i) => (
                            <div key={i} style={{ width: 11, height: 11, borderRadius: 6, background: color }} />
                        ))}
                    </div>
                    {/* Верх длинного скриншота: ширина по окну, низ обрезается */}
                    {/* eslint-disable-next-line @next/next/no-img-element -- satori рисует только <img> */}
                    <img src={shot} width={SHOT_WIDTH} alt="" style={{ flex: 'none' }} />
                </div>
            </div>
        ),
        { ...size, fonts: await ogFonts() }
    );
}

export default OpengraphImage
