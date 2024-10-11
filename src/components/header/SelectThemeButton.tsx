import { FC, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

import whiteTh from '@/assets/_img/icons/white-theme.svg'
import blackTh from '@/assets/_img/icons/moon.svg'


import s from './SelectThemeButton.module.scss'

const spring = {
    type: "spring",
    stiffness: 700,
    damping: 30
  };

const SelectThemeButton:FC = () => {

    const [isOn, setIsOn] = useState(false);

    const toggleSwitch = () => setIsOn(!isOn)
    return (
        <div className={s.theme} data-ison={isOn} onClick={toggleSwitch}>
            <motion.div layout transition={spring} className={s.touch}>
                <Image priority className={s.touchImg} src={isOn ? whiteTh : blackTh} alt="w-th" />
            </motion.div>
        </div>
    )
}

export default SelectThemeButton