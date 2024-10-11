import { FC, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import volumeICO from '@/assets/_img/icons/volume.svg';
import novolume from '@/assets/_img/icons/none-volume.svg';

import s from './Volume.module.scss';

interface IVolume {
  handleVolumeChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  volume: number;
}

const Volume: FC<IVolume> = ({ volume, handleVolumeChange }) => {
  const [isHover, setIsHover] = useState(false);

  return (
    <motion.div 
      className={s.wrapper}
      onHoverStart={() => setIsHover(true)}
      onHoverEnd={() => setIsHover(false)}
    >
      <motion.div
        className={s.volumeControl}
        animate={{ opacity: isHover ? 1 : 0, pointerEvents: isHover ? 'all' : 'none' }}
      >
        <input
          className={s.customRangeInput}
          id="volumeSlider"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
        />
        <div style={{ width: `${volume * 74}%` }} className={s.line}></div>
      </motion.div>

      <motion.div className={s.hz} animate={{ pointerEvents: isHover ? 'all' : 'none' }} />

      <motion.div>
      <motion.div whileHover={{ opacity: 0.5 }}>
        <Image 
          width={24} 
          src={volume > 0 ? volumeICO : novolume} 
          alt={volume > 0 ? "Громкость" : "Нет звука"}
        />
      </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default Volume;
