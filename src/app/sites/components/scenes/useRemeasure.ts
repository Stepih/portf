import { RefObject, useEffect } from "react";

// Начало липкой сцены (useStickyScene) замеряется по offsetTop, а ResizeObserver движка следит только за размерами
// самой сцены. На /sites длины сцен выше считаются по замерам уже после монтирования (и колода встаёт на стык
// с окном) – разделы над сценой меняют высоту, и её начало сдвигается. Перемеряем, когда меняется высота обёртки
// разделов страницы (родителя сцены): у body высота может быть задана и не меняться
export const useRemeasure = (scene: RefObject<HTMLElement | null>, measure: () => void) => {
    useEffect(() => {
        const parent = scene.current?.parentElement;
        if (!parent) return;
        const observer = new ResizeObserver(() => measure());
        observer.observe(parent);
        return () => observer.disconnect();
    }, [scene, measure]);
};
