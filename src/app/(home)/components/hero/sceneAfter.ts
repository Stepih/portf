"use client";

import { createContext } from "react";
import { MotionValue } from "framer-motion";

// Доля пути после портала (HeroExpand): «Избранные кейсы» ещё прилипают к экрану, а скролл раздаёт их из колоды.
// null – такого пути нет (телефон или блок не под сценой): карточки анимируются сами, по своему скроллу
export const SceneAfterContext = createContext<MotionValue<number> | null>(null);
