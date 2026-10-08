"use client"
import { FC, useEffect, useRef, useState } from "react";

import s from './History.module.scss'
import CheckPoints from "./checpoints/CheckPoints";
import ScrollToArrow from "@/components/ui/scrollToArrow/ScrollToArrow";
import Steps from "./steps/Steps";
import { IMusicHistory } from "@/interfaces/musicHistory";
import { ralewayBold } from "@/app/fonts/fonts";
import { IPinnedLayout, pinnedLayout, pinnedPosition } from "./pinnedScroll";

// Сколько прокрутки (в долях высоты экрана) шаг стоит на месте, прежде чем смениться следующим
const HOLD = .6;

const History:FC<{musicHistory: IMusicHistory[]}> = ({musicHistory}) => {
    const [step, setStep] = useState(0)
    const [trackHeight, setTrackHeight] = useState<number>()
    // Дорожка задаёт длину прокрутки, рамка внутри неё прилипает к экрану
    const trackRef = useRef<HTMLDivElement>(null)
    const frameRef = useRef<HTMLDivElement>(null)
    const barRef = useRef<HTMLDivElement>(null)
    const stepRefs = useRef<(HTMLElement | null)[]>([])
    const layoutRef = useRef<IPinnedLayout | null>(null)

    useEffect(() => {
        const frame = frameRef.current
        const bar = barRef.current
        if (!frame || !bar) return
        let raf = 0

        // Сдвиг активного шага пишется прямо в style, без ререндера на каждый кадр прокрутки
        const update = () => {
            raf = 0
            const layout = layoutRef.current
            const track = trackRef.current
            if (!layout || !track) return
            const { step, offset } = pinnedPosition(layout, -track.getBoundingClientRect().top)
            setStep(step)
            const el = stepRefs.current[step]
            if (el) el.style.transform = `translateY(${-offset}px)`
        }

        const measure = () => {
            const viewport = frame.clientHeight
            const heights = stepRefs.current
                .slice(0, musicHistory.length)
                .map(el => el?.offsetHeight ?? 0)
            const layout = pinnedLayout(heights, viewport - bar.offsetHeight, Math.round(viewport * HOLD))
            layoutRef.current = layout
            setTrackHeight(viewport + layout.total)
            update()
        }

        const onScroll = () => {
            if (!raf) raf = requestAnimationFrame(update)
        }

        // Высота шагов меняется, когда догружаются картинки и видео, и при смене ширины
        const observer = new ResizeObserver(measure)
        observer.observe(frame)
        observer.observe(bar)
        stepRefs.current.slice(0, musicHistory.length).forEach(el => el && observer.observe(el))

        window.addEventListener('scroll', onScroll, { passive: true })
        return () => {
            cancelAnimationFrame(raf)
            observer.disconnect()
            window.removeEventListener('scroll', onScroll)
        }
    }, [musicHistory.length])

    // Клик по чекпоинту: прокрутить страницу к началу отрезка этого шага
    const handleSelectStep = (idx: number) => {
        const layout = layoutRef.current
        const track = trackRef.current
        if (!layout || !track) return
        window.scrollTo({
            top: track.getBoundingClientRect().top + window.scrollY + layout.starts[idx] + 1,
            behavior: 'smooth',
        })
    }

    return (
        <>
            <ScrollToArrow forid="title-history"/>
            <div className={s.wrapper}>
                <h3 id="title-history" className={`${s.title} ${ralewayBold.className}`}>Чем я занимался</h3>
                <div ref={trackRef} className={s.track} style={{height: trackHeight}}>
                    <div ref={frameRef} className={s.frame}>
                        <div ref={barRef} className={s.bar}>
                            <CheckPoints steps={musicHistory} step={step} onSelect={handleSelectStep}/>
                        </div>
                        <div className={s.stage}>
                            <Steps musicHistory={musicHistory} step={step} stepRefs={stepRefs}/>
                        </div>
                    </div>
                </div>
            </div>
        </>

    )
}

export default History
