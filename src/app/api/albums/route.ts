import { getAlbums } from "@/lib/content/albums";

export async function GET() {
    return Response.json(await getAlbums());
}
