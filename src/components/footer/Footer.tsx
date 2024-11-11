"use client"

import { FC, useEffect, useState } from "react";

import s from './Footer.module.scss'

import { allerta } from "@/fonts/fonts";

const Footer:FC = () => {
    const [currentDate, setCurrentDate] = useState('');
    useEffect(() => {
        const date = new Date().toLocaleDateString();
        setCurrentDate(date);
    }, []);

    return (
        <footer 
            className={`${s.footer} ${allerta.className}`}>
            {currentDate && <span>&#169; Portfolio by Kartuzov Stepan 21.10.2024 - {currentDate} </span>}
        </footer>
    )
}

export default Footer