"use client"

import { AnchorHTMLAttributes, FC, MouseEvent } from "react";
import { contactSectionId, contactTitleId } from "@/constants/urls";
import { ServiceId } from "@/interfaces/offer";
import { contactHref, SERVICE_PARAM } from "@/scripts/services";

// Ссылка на форму главной (DESIGN_FIXES_3_PLAN Д13): мгновенный прыжок к #contact мимо сцены, фокус – на заголовок формы
// (решения владельца). Услуга – параметром в адресе без перезагрузки: форма показывает её и отправляет с заявкой.
// Без JS, в новой вкладке и вне главной – обычный переход по адресу
interface IContactLink extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
    service?: ServiceId
}

const ContactLink: FC<IContactLink> = ({ service, onClick, children, ...rest }) => {
    const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(e);
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

        const section = document.getElementById(contactSectionId);
        if (!section) return;
        e.preventDefault();

        // Next синхронизирует replaceState с useSearchParams, если состояние не его (null): строка услуги обновится сама
        const url = new URL(window.location.href);
        if (service) url.searchParams.set(SERVICE_PARAM, service);
        url.hash = contactSectionId;
        window.history.replaceState(null, '', url);

        // 'instant' – иначе глобальный scroll-behavior: smooth прокрутит через всю сцену
        section.scrollIntoView({ behavior: 'instant', block: 'start' });
        document.getElementById(contactTitleId)?.focus({ preventScroll: true });
    };

    return (
        <a href={contactHref(service)} onClick={handleClick} {...rest}>
            {children}
        </a>
    )
}

export default ContactLink
