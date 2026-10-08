import { ElementType } from 'react'
import learn from '@/assets/_img/icons/learn.svg'
import endLearn from '@/assets/_img/icons/end-learn.svg'
import flStudio from '@/assets/_img/icons/fl-studio.svg'
import { HistoryIcon } from '@/interfaces/musicHistory'

// В данных хранится только ключ: компонент нельзя передать из серверной страницы и отдать в /api/music-history
export const historyIcons: Record<HistoryIcon, ElementType> = {
    learn,
    endLearn,
    flStudio,
}
