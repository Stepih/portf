import fs from "fs/promises";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getAlbums } from "./albums";

// Минимальный WAV: 8 кГц, моно, 8 бит, тишина заданной длины
const SAMPLE_RATE = 8000;
const wav = (seconds: number): Buffer => {
    const dataSize = SAMPLE_RATE * seconds;
    const buf = Buffer.alloc(44 + dataSize, 0x80);
    buf.write("RIFF", 0);
    buf.writeUInt32LE(36 + dataSize, 4);
    buf.write("WAVE", 8);
    buf.write("fmt ", 12);
    buf.writeUInt32LE(16, 16);
    buf.writeUInt16LE(1, 20); // PCM
    buf.writeUInt16LE(1, 22); // каналы
    buf.writeUInt32LE(SAMPLE_RATE, 24);
    buf.writeUInt32LE(SAMPLE_RATE, 28); // байт в секунду
    buf.writeUInt16LE(1, 32); // байт на сэмпл
    buf.writeUInt16LE(8, 34); // бит на сэмпл
    buf.write("data", 36);
    buf.writeUInt32LE(dataSize, 40);
    return buf;
};

let musicDir: string;

// Кладёт файл во временную папку музыки, создавая папку альбома
const put = async (relPath: string, content: Buffer | string) => {
    const full = path.join(musicDir, relPath);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, content);
};

beforeEach(async () => {
    musicDir = await fs.mkdtemp(path.join(os.tmpdir(), "albums-"));
});

afterEach(async () => {
    await fs.rm(musicDir, { recursive: true, force: true });
});

describe("getAlbums", () => {
    it("папка с треком становится альбомом: имя без расширения, публичный путь, длительность", async () => {
        await put("Demo/Intro.wav", wav(3));

        expect(await getAlbums(musicDir)).toEqual([
            {
                id: 0,
                name: "Demo",
                tracks: [{ id: 0, name: "Intro", path: "/music/Demo/Intro.wav", duration: "0:03" }],
                img: "",
                artist: "SyrinxBS",
            },
        ]);
    });

    it("prev.png даёт обложку, artist.txt — исполнителя без пробелов по краям", async () => {
        await put("Demo/Intro.wav", wav(1));
        await put("Demo/prev.png", "png");
        await put("Demo/artist.txt", "  Someone Else\n");

        const [album] = await getAlbums(musicDir);

        expect(album.img).toBe("/music/Demo/prev.png");
        expect(album.artist).toBe("Someone Else");
    });

    it("альбомы и треки идут в натуральном порядке, id — позиция после сортировки", async () => {
        await put("10/a.wav", wav(1));
        await put("2/a.wav", wav(1));
        await put("2/10 Outro.wav", wav(1));
        await put("2/2 Middle.wav", wav(1));

        const albums = await getAlbums(musicDir);

        expect(albums.map(a => [a.id, a.name])).toEqual([[0, "2"], [1, "10"]]);
        expect(albums[0].tracks.map(t => [t.id, t.name])).toEqual([
            [0, "2 Middle"],
            [1, "10 Outro"],
            [2, "a"],
        ]);
    });

    it("берёт только аудио любого регистра расширения, папку без треков пропускает", async () => {
        await put("Mixed/song.MP3", "не настоящий mp3");
        await put("Mixed/cover.jpg", "jpg");
        await put("Mixed/notes.txt", "txt");
        await put("Empty/prev.png", "png");
        await put("Empty/readme.txt", "txt");
        await put("loose.wav", wav(1)); // файл в корне — не альбом

        const albums = await getAlbums(musicDir);

        expect(albums.map(a => a.name)).toEqual(["Mixed"]);
        expect(albums[0].tracks.map(t => [t.name, t.path])).toEqual([["song", "/music/Mixed/song.MP3"]]);
    });

    it("битый файл не роняет список, а получает длительность 0:00", async () => {
        await put("Demo/broken.mp3", "не настоящий mp3");

        const [album] = await getAlbums(musicDir);

        expect(album.tracks[0].duration).toBe("0:00");
    });

    it("заменённый файл получает новую длительность, а не значение из кэша", async () => {
        await put("Demo/Intro.wav", wav(2));
        expect((await getAlbums(musicDir))[0].tracks[0].duration).toBe("0:02");

        await put("Demo/Intro.wav", wav(5));
        expect((await getAlbums(musicDir))[0].tracks[0].duration).toBe("0:05");
    });
});
