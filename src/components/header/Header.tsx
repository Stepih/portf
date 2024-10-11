"use client"

import { FC } from "react";

import Link from "next/link";
import Image from "next/image";


import inst from '@/assets/_img/icons/inst.svg'
import tg from '@/assets/_img/icons/tg-white.svg'

import s from './Header.module.scss'

import { myInst, myTg } from "@/constants/urls";
import SelectThemeButton from "./SelectThemeButton";



const Header:FC = () => {
    

    return (
        <header className={s.header}>
            <SelectThemeButton />
            <div className={s.contacts}>
                <span className={s.contactsTitle}>Контакты</span>
                <div className={s.contactsLink}>
                    <Link href={myInst}>
                        <Image priority className={s.contactImg} src={inst} alt="Instagram" />
                    </Link>
                    <Link href={myTg}>
                        <Image priority className={s.contactImg} src={tg} alt="Telegram"/>
                    </Link>
                </div>
            </div>
        </header>
    )
}

export default Header