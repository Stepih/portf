// В начале файла
"use client";

import { FC, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import s from "./Background.module.scss";
import { BgRectangle1, BgRectangle2 } from "./BgRectangle";

const BackgroundPage: FC = () => {
    const [currentUrl, setCurrentUrl] = useState('');
    
    const pathname = usePathname(); // Получение текущего пути
    useEffect(() => {
        // Разбиваем путь на сегменты
        const segments = pathname.split('/').filter(Boolean);
        // Получаем последний сегмент или '/' если сегментов нет
        const lastSegment = segments.length > 0 ? `/${segments[segments.length - 1]}` : '/';
        setCurrentUrl(lastSegment);
    }, [pathname]);


    return (
        <div className={`${s.bg} `}>
            <BgRectangle1 currentUrl={currentUrl} />
            <BgRectangle2 currentUrl={currentUrl} />
        </div>
    );
}

export default BackgroundPage;
