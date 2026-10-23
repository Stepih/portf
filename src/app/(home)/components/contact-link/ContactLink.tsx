"use client"

import { AnchorHTMLAttributes, FC, MouseEvent, useEffect } from "react";
import { contactSectionId, contactTitleId } from "@/constants/urls";
import { ServiceId } from "@/interfaces/offer";
import { contactHref, SERVICE_PARAM } from "@/scripts/services";

// Ссылка на форму главной (DESIGN_FIXES_3_PLAN Д13): мгновенный прыжок к #contact мимо сцены, фокус – на заголовок формы
// (решения владельца). Услуга – параметром в адресе без перезагрузки: форма показывает её и отправляет с заявкой.
// Прыжок – новая запись истории (DESIGN_FIXES_4_PLAN Д18): «Назад» мгновенно возвращает к месту нажатия и фокус на нажатую
// ссылку, «Вперёд» – снова к форме. Без JS, в новой вкладке и вне главной – обычный переход по адресу
interface IContactLink extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
    service?: ServiceId
}

// Метка ссылок для поиска нажатой после «Назад» и ключ точки возврата в history.state записи, с которой прыгнули
const LINK_ATTR = 'data-contact-link';
const RETURN_KEY = 'contactReturn';

interface IContactReturn {
    y: number,
    link: number
}

const isReturn = (value: unknown): value is IContactReturn =>
    typeof value === 'object' && value !== null
    && typeof (value as IContactReturn).y === 'number' && typeof (value as IContactReturn).link === 'number';

// 'instant' – иначе глобальный scroll-behavior: smooth прокрутит через всю сцену
const jumpToForm = () => {
    document.getElementById(contactSectionId)?.scrollIntoView({ behavior: 'instant', block: 'start' });
    document.getElementById(contactTitleId)?.focus({ preventScroll: true });
};

// Скролл и фокус записи истории. Сначала фокус: обработчики фокуса сцены могут прокрутить её, позиция ставится после них
const restore = (state: unknown) => {
    const back: unknown = (state as Record<string, unknown> | null)?.[RETURN_KEY];
    if (isReturn(back)) {
        document.querySelectorAll<HTMLElement>(`a[${LINK_ATTR}]`)[back.link]?.focus({ preventScroll: true });
        window.scrollTo({ top: back.y, behavior: 'instant' });
    } else if (window.location.hash === `#${contactSectionId}`) jumpToForm();
};

// «Назад» и «Вперёд». Next (App Router) сам обновляет адрес в роутере (useSearchParams – строка услуги) и не прокручивает
// при восстановлении записи, поэтому здесь – только скролл и фокус. Повтор в следующем кадре: после popstate браузер
// сам восстанавливает запись с #contact – плавно едет к якорю и сбрасывает фокус (двойной прыжок к форме, перезагрузка)
const onPopState = (e: PopStateEvent) => {
    restore(e.state);
    requestAnimationFrame(() => restore(e.state));
};

// Один слушатель на все ссылки страницы. Он живёт, пока на странице есть ContactLink: «Назад» на главную с другой страницы
// сюда не попадает – главная к этому моменту ещё не смонтирована
let listeners = 0;

const ContactLink: FC<IContactLink> = ({ service, onClick, children, ...rest }) => {
    useEffect(() => {
        if (listeners++ === 0) window.addEventListener('popstate', onPopState);
        return () => {
            if (--listeners === 0) window.removeEventListener('popstate', onPopState);
        };
    }, []);

    const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(e);
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        if (!document.getElementById(contactSectionId)) return;
        e.preventDefault();

        // Точка возврата – в текущую запись. Состояние Next (__NA) сохраняется, поэтому патч Next пропускает этот вызов:
        // адрес тот же, роутер и Метрика его не замечают
        const link = Array.from(document.querySelectorAll(`a[${LINK_ATTR}]`)).indexOf(e.currentTarget);
        const back: IContactReturn = { y: window.scrollY, link };
        window.history.replaceState({ ...window.history.state, [RETURN_KEY]: back }, '');

        // Новая запись. Next копирует в неё своё состояние и синхронизирует адрес с useSearchParams, если состояние не его:
        // строка услуги обновится сама, hit Метрики – один на переход, как и раньше
        const url = new URL(window.location.href);
        if (service) url.searchParams.set(SERVICE_PARAM, service);
        url.hash = contactSectionId;
        window.history.pushState(null, '', url);

        jumpToForm();
    };

    return (
        <a href={contactHref(service)} onClick={handleClick} data-contact-link="" {...rest}>
            {children}
        </a>
    )
}

export default ContactLink
