import { FC } from "react";

import { motion } from "framer-motion";

import Image from "next/image";
import pause from '@/assets/_img/icons/pause.svg'
import play from '@/assets/_img/icons/play.svg'

import s from './StatusAlbum.module.scss'

const StatusTrack:FC<{status:boolean}> = ({status}) => {
    return (
        <motion.div 
            className={s.status}
            initial={{opacity: 0}}
            animate={{ opacity: 1 }}
            transition={{ ease: "easeInOut", duration: 1 }}
            >
            {status &&
            <motion.div 
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ ease: "easeInOut", duration: 0.5 }}
                ><Image className={s.pause} src={pause} alt="Пауза" />
            </motion.div>}
            {/* {!status && 
            <motion.div 
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ ease: "easeInOut", duration: 0.5 }}
                ><Image className={s.play} src={play} alt="Play" />
        </motion.div>} */}
        </motion.div>
    )
}

export default StatusTrack