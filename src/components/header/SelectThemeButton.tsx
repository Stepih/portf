import { FC, useEffect, useState } from "react";
import { motion } from "framer-motion";

import WhiteTh from '@/assets/_img/icons/white-theme.svg'
import BlackTh from '@/assets/_img/icons/moon.svg'

import s from './SelectThemeButton.module.scss'

const spring = {
    type: "spring",
    stiffness: 700,
    damping: 30
  };

  type Theme = "light" | "dark";

const SelectThemeButton:FC = () => {
    const [theme, setTheme] = useState<Theme>("light");

    // Тему на <html> уже поставил inline-скрипт из layout.tsx, кнопка только подхватывает её.
    // Тему по умолчанию здесь не пишем, иначе до чтения сохранённой мелькнёт светлая.
    // Исключение – 404 из notFound() страницы (скрытая /music): Next отдаёт пустую оболочку, React рисует <html> заново,
    // атрибут теряется, а скрипт из layout второй раз не исполняется. Тогда ставим сохранённую тему сами (Д46)
    useEffect(() => {
        const root = document.documentElement;
        if (!root.dataset.theme) {
            try {
                const saved = localStorage.getItem("theme");
                if (saved === "light" || saved === "dark") root.setAttribute("data-theme", saved);
            } catch {}
        }
        if (root.dataset.theme === "dark") setTheme("dark")
    }, [])

    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
        try { localStorage.setItem("theme", newTheme) } catch {}
        document.documentElement.setAttribute("data-theme", newTheme);
    };


    const toggleSwitch = () => {
        toggleTheme()
    }
    return (
        <button
            type="button"
            className={s.theme}
            data-ison={theme}
            onClick={toggleSwitch}
            aria-label="Тёмная тема"
            aria-pressed={theme === "dark"}
        >
            <motion.div layout transition={spring} className={s.touch}>
                {theme === "light" ? <WhiteTh className={s.touchImg}/> : <BlackTh className={s.touchImg}/>}
            </motion.div>
        </button>
    )
}

export default SelectThemeButton