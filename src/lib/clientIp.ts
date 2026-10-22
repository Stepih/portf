// IP клиента для rate-limit: прод стоит за прокси, настоящий адрес – первый в x-forwarded-for
export const getClientIp = (req: Request) =>
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';
