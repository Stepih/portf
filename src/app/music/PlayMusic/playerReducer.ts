import { IAlbums } from "@/interfaces/albums";

export interface PlayerState {
    album: IAlbums | null,
    trackIndex: number,
    isPlaying: boolean,
}

export type PlayerAction =
    | { type: 'selectAlbum', album: IAlbums }
    | { type: 'close' }
    | { type: 'selectTrack', index: number }
    | { type: 'togglePlay' }
    | { type: 'next' }
    | { type: 'prev' }
    | { type: 'ended' }
    | { type: 'playFailed' };

export const initialPlayerState: PlayerState = { album: null, trackIndex: 0, isPlaying: false };

// Все переходы состояния плеера. Само <audio> подстраивается под результат в useAudioPlayer
export const playerReducer = (state: PlayerState, action: PlayerAction): PlayerState => {
    if (action.type === 'selectAlbum') {
        // Повторный клик по текущему альбому работает как play/pause
        if (state.album?.id === action.album.id) return { ...state, isPlaying: !state.isPlaying };
        return { album: action.album, trackIndex: 0, isPlaying: true };
    }
    if (action.type === 'close') return initialPlayerState;

    const { album, trackIndex } = state;
    if (!album) return state;
    const count = album.tracks.length;

    switch (action.type) {
        case 'selectTrack':
            if (action.index < 0 || action.index >= count) return state;
            if (action.index === trackIndex) return { ...state, isPlaying: !state.isPlaying };
            return { ...state, trackIndex: action.index, isPlaying: true };
        case 'togglePlay':
            return { ...state, isPlaying: !state.isPlaying };
        // На краях альбома кнопки неактивны и ничего не делают
        case 'next':
            return trackIndex < count - 1 ? { ...state, trackIndex: trackIndex + 1, isPlaying: true } : state;
        case 'prev':
            return trackIndex > 0 ? { ...state, trackIndex: trackIndex - 1, isPlaying: true } : state;
        // Трек доиграл: следующий, а после последнего — пауза на нём
        case 'ended':
            return trackIndex < count - 1
                ? { ...state, trackIndex: trackIndex + 1, isPlaying: true }
                : { ...state, isPlaying: false };
        case 'playFailed':
            return { ...state, isPlaying: false };
    }
};
