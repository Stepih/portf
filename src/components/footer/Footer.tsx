"use client"

import { FC, useEffect, useState } from "react";
import { motion } from "framer-motion";

import s from './Footer.module.scss'

import { allerta } from "@/fonts/fonts";

const Footer:FC = () => {
    const [currentDate, setCurrentDate] = useState('');
    useEffect(() => {
        const date = new Date().toLocaleDateString();
        setCurrentDate(date);
    }, []);

    return (
        <motion.footer 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ ease: "easeInOut", duration: 0.75 }} 
            className={`${s.footer} ${allerta.className}`}>
            {/* {currentDate && <span>&#169; Kartuzov Stepan 21.10.2024 - {currentDate} </span>} */}
        </motion.footer>
    )
}

export default Footer