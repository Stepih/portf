import { ImageResponse } from "next/og";

import { heroSlides, heroTitleSlide, offerTitle, offerTrustLine } from "@/data/offer";
import { OgWords, ogColors, ogContentType, ogFonts, ogImage, ogSize, ogText } from "@/lib/og";

// Превью ссылки на сайт (SALES_PLAN 5.6): оффер как на первом экране главной, строка доверия и фото.
// Достаётся всем страницам без своей картинки
export const alt = ogText(offerTitle);
export const size = ogSize;
export const contentType = ogContentType;

const OpengraphImage = async () => {
    const photo = await ogImage('src/assets/_img/rectangles/title-page/i.png');

    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 64,
                    padding: '0 80px',
                    fontFamily: 'Raleway',
                    color: ogColors.text,
                    // Размытые пятна, как фон сайта. Цвет в satori – отдельным свойством, не в списке с градиентами
                    backgroundColor: ogColors.bg,
                    backgroundImage: `radial-gradient(circle at 8% 18%, rgba(234, 119, 119, 0.28), transparent 32%),
                        radial-gradient(circle at 92% 88%, rgba(119, 199, 234, 0.32), transparent 36%)`
                }}
            >
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 26 }}>
                    <div style={{ fontFamily: 'Allerta Stencil', fontSize: 34, letterSpacing: 2, textTransform: 'uppercase' }}>
                        {heroSlides[heroTitleSlide].headline}
                    </div>
                    <OgWords text={offerTitle} style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.1 }} />
                    <div style={{ fontSize: 28, color: ogColors.muted }}>{offerTrustLine()}</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- satori рисует только <img> */}
                    <img src={photo} width={240} height={241} alt="" style={{ borderRadius: 24 }} />
                    <div style={{ fontSize: 28, fontWeight: 700 }}>Степан Картузов</div>
                </div>
            </div>
        ),
        { ...size, fonts: await ogFonts() }
    );
}

export default OpengraphImage
