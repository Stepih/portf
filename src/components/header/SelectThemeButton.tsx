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
    useEffect(()=> {
        const localTheme = localStorage.getItem("theme")
        if ("light" === localTheme || "dark" === localTheme){
            setTheme(localTheme)
        }
    }, [])
    const [theme, setTheme] = useState<Theme>("dark");

    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light";
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme)
        document.documentElement.setAttribute("data-theme", newTheme);
    };

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
    }, [theme]);


    const toggleSwitch = () => {
        toggleTheme()
    }
    return (
        <div className={s.theme} data-ison={theme} onClick={toggleSwitch}>
            <motion.div layout transition={spring} className={s.touch}>
                {theme === "light" ? <WhiteTh className={s.touchImg}/> : <BlackTh className={s.touchImg}/>}
            </motion.div>
        </div>
    )
}

export default SelectThemeButton