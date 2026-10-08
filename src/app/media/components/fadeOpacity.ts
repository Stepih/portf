export interface IBlockBounds {
    top: number;
    bottom: number;
}

// Во сколько раз блок гаснет быстрее, чем уезжает
const FADE_SPEED = 3;

// Прозрачность липкого блока на /media в зависимости от прокрутки страницы
export const fadeOpacity = (scrollY: number, { top, bottom }: IBlockBounds): number => {
    if (bottom - top === 0 || scrollY < top) return 1;
    return Math.max(1 - ((scrollY - top) / (bottom - top)) * FADE_SPEED, 0);
};
