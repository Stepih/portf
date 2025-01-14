import { FC } from "react";
import { motion } from "framer-motion"; 

import s from './BgFocus.module.scss'

export const BgFocus: FC<{status: boolean}> = ({status}) => <motion.div 
initial={{opacity: 0}} 
animate={{opacity: status ? .7 : 0}} 
exit={{opacity: 0}}
className={s.bg}></motion.div>

export default BgFocus