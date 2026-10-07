import { getMusicHistory } from "@/lib/content/musicHistory";

export async function GET() {
    return Response.json(await getMusicHistory());
}
