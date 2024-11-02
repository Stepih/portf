import { ChangeEvent, FC, useState } from "react";
import { motion } from "framer-motion";

import VolumeICO from '@/assets/_img/icons/volume.svg';
import NoVolumeICO from '@/assets/_img/icons/none-volume.svg';

import s from './Volume.module.scss';

interface IVolume {
  handleVolumeChange: (num: string) => void;
  volume: number;
}

const Volume: FC<IVolume> = ({ volume, handleVolumeChange }) => {
  const [isHover, setIsHover] = useState(false);

  const mute = () => {
    const caheVolume = localStorage.getItem("playerVolume") || '1';
    if (volume !== 0) {
      handleVolumeChange('0') 
      localStorage.setItem("playerVolume", caheVolume);
      return
    }
    handleVolumeChange(caheVolume)
  }

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
          onInput={(event:ChangeEvent<HTMLInputElement>) => handleVolumeChange(event.target.value)}
          
        />
        <div style={{ width: `${volume * 74}%` }} className={s.line}></div>
      </motion.div>

      <motion.div onClick={mute} className={s.hz} animate={{ pointerEvents: isHover ? 'all' : 'none' }} />

      <motion.div>
      <motion.div  animate={{opacity: isHover ? .5 : 1}}>
        {volume > 0 ? <VolumeICO /> : <NoVolumeICO />}
      </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default Volume;
