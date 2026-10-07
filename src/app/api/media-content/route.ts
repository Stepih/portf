import { getMediaContent } from '@/lib/content/mediaContent';

export async function GET() {
    try {
        return Response.json(await getMediaContent(), {
            headers: {
                'Access-Control-Allow-Origin': '*',  // Разрешение для всех доменов
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',  // Разрешаем HTTP методы
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
        });
    } catch (error) {
        console.error("Ошибка при обработке запроса:", error);
        return Response.json(
            { message: "Произошла ошибка при обработке запроса" },
            { status: 500 }
        );
    }
}
