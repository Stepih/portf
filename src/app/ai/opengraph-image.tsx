import { ImageResponse } from "next/og";

import { ogLine, ph } from "@/data/aiPage";
import { OgWords, ogColors, ogContentType, ogFonts, ogImage, ogSize, ogText } from "@/lib/og";

// Превью ссылки на /ai (SERVICES_PLAN У4, выбор владельца): как общая картинка сайта – фон, фото, имя,
// но заголовок первого экрана страницы и строка про демо и серверы. Строки доверия нет: её проекты и отрасли – про сайты
export const alt = ogText(ph.title);
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
                    // Пятна – как у общей картинки, голубое крупнее: цвет шара чата (DESIGN.md, «Шар чата»)
                    backgroundColor: ogColors.bg,
                    backgroundImage: `radial-gradient(circle at 8% 18%, rgba(234, 119, 119, 0.24), transparent 30%),
                        radial-gradient(circle at 90% 85%, rgba(119, 199, 234, 0.4), transparent 42%)`
                }}
            >
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 26 }}>
                    <OgWords text={ph.title} style={{ fontSize: 66, fontWeight: 700, lineHeight: 1.1 }} />
                    <div style={{ fontSize: 30, color: ogColors.muted }}>{ogLine}</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
                    <img src={photo} width={240} height={241} alt="" style={{ borderRadius: 24 }} />
                    <div style={{ fontSize: 28, fontWeight: 700 }}>Степан Картузов</div>
                </div>
            </div>
        ),
        { ...size, fonts: await ogFonts() }
    );
}

export default OpengraphImage
