// IP клиента для лимитов чата и формы (CONVERSION_PLAN К3.2, защита от накрутки).
// Vercel сам ставит x-real-ip и x-forwarded-for и затирает присланные клиентом – подделать нельзя.
// За своим прокси (Docker) он должен ставить x-real-ip из адреса соединения. Если его нет, берётся последний адрес
// x-forwarded-for: его дописал ближайший прокси, а первый присылает сам клиент и может подставить любой
export const getClientIp = (req: Request): string => {
    const realIp = req.headers.get('x-real-ip')?.trim();
    if (realIp) return realIp;
    const forwarded = req.headers.get('x-forwarded-for')?.split(',').map((ip) => ip.trim()).filter(Boolean);
    return forwarded?.[forwarded.length - 1] || 'unknown';
};
