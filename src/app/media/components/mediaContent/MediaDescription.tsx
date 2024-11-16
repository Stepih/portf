"use client";

import { FC } from "react";
import Link from "next/link";
import s from "./MediaDescription.module.scss";
import { ralewayBold } from "@/fonts/fonts";

interface MediaDescriptionProps {
    description: string;
    title: string
}

const MediaDescription: FC<MediaDescriptionProps> = ({ description, title }) => {
    const parts = description.split("{link}");

    return (
        <>
        <h2 className={`${s.title} ${ralewayBold.className}`}>{title}</h2>
        <p className={s.description}>
            {parts.length > 1 ? (
                <>
                    {parts[0]}
                    <Link className={s.link} href="/music">этой странице</Link>
                    {parts[1]}
                </>
            ) : (
                description
            )}
        </p>
        </>
        
    );
};

export default MediaDescription;
