import { describe, expect, it } from "vitest";
import { IAlbums } from "@/interfaces/albums";
import { initialPlayerState, PlayerState, playerReducer } from "./playerReducer";

const makeAlbum = (id: number, trackCount: number): IAlbums => ({
    id,
    name: `Альбом ${id}`,
    img: '',
    artist: 'SyrinxBS',
    tracks: Array.from({ length: trackCount }, (_, i) => ({
        id: i,
        name: `Трек ${i}`,
        path: `/music/${id}/${i}.mp3`,
        duration: '1:00',
    })),
});

const albumA = makeAlbum(0, 3);
const albumB = makeAlbum(1, 2);

const playing = (album: IAlbums, trackIndex: number): PlayerState => ({ album, trackIndex, isPlaying: true });
const paused = (album: IAlbums, trackIndex: number): PlayerState => ({ album, trackIndex, isPlaying: false });

describe("playerReducer: выбор альбома", () => {
    it("новый альбом играет с первого трека", () => {
        expect(playerReducer(initialPlayerState, { type: 'selectAlbum', album: albumA })).toEqual(playing(albumA, 0));
        expect(playerReducer(paused(albumA, 2), { type: 'selectAlbum', album: albumB })).toEqual(playing(albumB, 0));
    });

    it("повторный клик по текущему альбому ставит паузу и снимает её, трек не меняется", () => {
        const afterPause = playerReducer(playing(albumA, 2), { type: 'selectAlbum', album: albumA });
        expect(afterPause).toEqual(paused(albumA, 2));
        expect(playerReducer(afterPause, { type: 'selectAlbum', album: albumA })).toEqual(playing(albumA, 2));
    });

    it("закрытие плеера убирает альбом и останавливает воспроизведение", () => {
        expect(playerReducer(playing(albumA, 1), { type: 'close' })).toEqual(initialPlayerState);
    });
});

describe("playerReducer: треки", () => {
    it("выбор другого трека запускает его", () => {
        expect(playerReducer(paused(albumA, 0), { type: 'selectTrack', index: 2 })).toEqual(playing(albumA, 2));
    });

    it("выбор текущего трека переключает паузу", () => {
        expect(playerReducer(playing(albumA, 1), { type: 'selectTrack', index: 1 })).toEqual(paused(albumA, 1));
        expect(playerReducer(paused(albumA, 1), { type: 'selectTrack', index: 1 })).toEqual(playing(albumA, 1));
    });

    it("несуществующий индекс игнорируется", () => {
        const state = playing(albumA, 1);
        expect(playerReducer(state, { type: 'selectTrack', index: 3 })).toBe(state);
        expect(playerReducer(state, { type: 'selectTrack', index: -1 })).toBe(state);
    });

    it("вперёд и назад переключают трек и запускают его", () => {
        expect(playerReducer(paused(albumA, 1), { type: 'next' })).toEqual(playing(albumA, 2));
        expect(playerReducer(paused(albumA, 1), { type: 'prev' })).toEqual(playing(albumA, 0));
    });

    it("на краях альбома вперёд и назад ничего не делают", () => {
        const last = paused(albumA, 2);
        const first = playing(albumA, 0);
        expect(playerReducer(last, { type: 'next' })).toBe(last);
        expect(playerReducer(first, { type: 'prev' })).toBe(first);
    });
});

describe("playerReducer: окончание трека", () => {
    it("переходит к следующему треку и продолжает играть", () => {
        expect(playerReducer(playing(albumA, 0), { type: 'ended' })).toEqual(playing(albumA, 1));
    });

    it("после последнего трека останавливается на нём", () => {
        expect(playerReducer(playing(albumA, 2), { type: 'ended' })).toEqual(paused(albumA, 2));
    });
});

describe("playerReducer: play/pause", () => {
    it("togglePlay переключает воспроизведение", () => {
        expect(playerReducer(playing(albumA, 1), { type: 'togglePlay' })).toEqual(paused(albumA, 1));
        expect(playerReducer(paused(albumA, 1), { type: 'togglePlay' })).toEqual(playing(albumA, 1));
    });

    it("без альбома togglePlay, next и ended ничего не делают", () => {
        for (const type of ['togglePlay', 'next', 'prev', 'ended'] as const) {
            expect(playerReducer(initialPlayerState, { type })).toBe(initialPlayerState);
        }
    });

    it("если браузер не дал воспроизвести, плеер встаёт на паузу", () => {
        expect(playerReducer(playing(albumA, 1), { type: 'playFailed' })).toEqual(paused(albumA, 1));
    });
});
