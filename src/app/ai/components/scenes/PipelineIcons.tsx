import { FC, ReactNode } from "react";

// Иконки входа для сцены «агент за работой»: одна толщина линии, цвет – currentColor
interface IIcon {
    className?: string
}

const Svg: FC<IIcon & { children: ReactNode }> = ({ className, children }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {children}
    </svg>
);

export const PhoneIcon: FC<IIcon> = ({ className }) => (
    <Svg className={className}>
        <path d="M6.5 3.5h3l1.5 4-2 1.3a10 10 0 0 0 6.2 6.2l1.3-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2z" />
    </Svg>
);

export const StarIcon: FC<IIcon & { filled?: boolean }> = ({ className, filled }) => (
    <svg className={className} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />
    </svg>
);

export const ChartIcon: FC<IIcon> = ({ className }) => (
    <Svg className={className}>
        <path d="M4 20h16" />
        <path d="M7 16v-5M12 16V7M17 16v-8" />
    </Svg>
);

export const DocIcon: FC<IIcon> = ({ className }) => (
    <Svg className={className}>
        <path d="M14 3.5H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-10z" />
        <path d="M14 3.5v5h5M8.5 13h7M8.5 16.5h5" />
    </Svg>
);
