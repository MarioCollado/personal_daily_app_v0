'use client'
import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Square, Trophy, RotateCcw } from 'lucide-react'
import { useTimeExercise } from '@/hooks/useTimeExercise'
import CircularTimer from './CircularTimer'
import { useI18n } from '@/contexts/I18nContext'
import clsx from 'clsx'

interface Props {
  onAddSet: (durationSeconds: number) => void
  adding: boolean
  previousSets: { duration_seconds: number | null }[]
}

export default function TimeSetComposer({ onAddSet, adding, previousSets }: Props) {
  const { t } = useI18n()
  const { isRunning, time, start, stop, reset } = useTimeExercise()

  const bestTime = useMemo(() => {
    const times = previousSets
      .map(s => s.duration_seconds)
      .filter((t): t is number => t !== null && t > 0)
    return times.length > 0 ? Math.max(...times) : null
  }, [previousSets])

  const handleToggle = () => {
    if (isRunning) {
      const finalTime = Math.round(time)
      stop()
      if (finalTime > 0) {
        onAddSet(finalTime)
      }
      reset()
    } else {
      start()
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 py-2">
      <AnimatePresence mode="wait">
        {bestTime && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[8px] font-bold uppercase tracking-[0.2em]"
          >
            <Trophy className="w-2 h-2" />
            <span>{t('workout.timer.best')} {String(Math.floor(bestTime / 60)).padStart(2, '0')}:{String(bestTime % 60).padStart(2, '0')}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative flex items-center justify-center">
        <CircularTimer time={time} isRunning={isRunning} />

        {/* Central Overlay Button */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={handleToggle}
          className={clsx(
            "absolute w-24 h-24 rounded-full flex flex-col items-center justify-center gap-1 transition-colors duration-500 shadow-2xl z-20",
            isRunning
              ? "bg-red-500 text-white shadow-red-500/30"
              : "bg-green-500 text-white shadow-green-500/30"
          )}
        >
          <AnimatePresence mode="wait">
            {isRunning ? (
              <motion.div
                key="stop"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="flex flex-col items-center"
              >
                <div className="text-xl font-mono font-bold tracking-tighter tabular-nums mb-0.5">
                  {Math.floor(time / 60)}:{(time % 60).toFixed(0).padStart(2, '0')}
                </div>
                <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-80">{t('workout.timer.stop')}</span>
              </motion.div>
            ) : (
              <motion.div
                key="start"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="flex flex-col items-center"
              >
                <Play className="w-6 h-6 fill-current mb-1 translate-x-0.5" />
                <span className="text-[9px] font-black uppercase tracking-widest">{t('workout.timer.start')}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {isRunning && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-white/30"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
          )}
        </motion.button>
      </div>

      <div className="text-center mt-2">
        <p className={clsx(
          "text-[10px] font-bold uppercase tracking-[0.2em] transition-colors",
          isRunning ? "text-green-500 animate-pulse" : "text-muted"
        )}>
          {isRunning ? t('workout.timer.recording') : t('workout.timer.ready')}
        </p>
      </div>
    </div>
  )
}
