// Запускает воспроизведение и сообщает, если браузер его не разрешил.
// AbortError игнорируется: play() прервали паузой или сменой трека, это не сбой
export const playAudio = (audio: HTMLAudioElement, onFail: () => void) => {
    audio.play().catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        onFail();
    });
};
