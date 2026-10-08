// Время в секундах → "м:сс". Нужно и серверу (длительность трека), и плееру
export const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
};
