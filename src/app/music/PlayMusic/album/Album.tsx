"use client"

import { FC } from "react";
import { motion } from "framer-motion";

import Image from "next/image";

import { canada } from "../../../fonts/fonts"; // Убедитесь, что шрифт импортируется
import { IAlbums } from "@/interfaces/albums";

import s from './Album.module.scss';

interface Album {
    album: IAlbums,
    handleAlbumSelect: (album: IAlbums) => void
}

const Album: FC<Album> = ({ album, handleAlbumSelect }) => {

    const variantsAnim = {
        hover: {
            scale: 1.05
        }
    };

    return (
        <motion.button
            whileHover="hover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
                delay: .1
            }}
            onClick={() => handleAlbumSelect(album)}
            className={`${s.album} ${canada.className}`}
        >
            {album.img ? (
                <div className={s.imgWrapper}>
                    <motion.div variants={variantsAnim}>
                        <Image
                            className={s.img}
                            src={album.img}
                            alt={album.name}
                            width={180}
                            height={180}
                        />
                    </motion.div>
                </div>
            ) : (
                <motion.div className={`${s.noImg} `}>
                    <motion.div variants={variantsAnim}>
                        {album.name}
                    </motion.div>
                </motion.div>
            )}
            <div className={s.title}>
                <h2 className={`${s.albumName}`}>{album.name}</h2>
                <h4 className={s.artist}>{album.artist}</h4>
            </div>
        </motion.button>
    );
};

export default Album;
