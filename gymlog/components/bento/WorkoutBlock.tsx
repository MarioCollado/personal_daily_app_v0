'use client'
import { Dumbbell, TrendingUp, TrendingDown, Minus, ChevronRight, Plus, Lock, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import type { Workout, Exercise } from '@/types'
import { useLongPress } from '@/hooks/useLongPress'
import { useI18n } from '@/contexts/I18nContext'

interface Props {
  workout: Workout | null
  exercises: Exercise[]
  onStart: () => void
  starting?: boolean
  isLocked?: boolean
  onToggleLock?: () => void
}

function ProgressBadge({ current, previous }: { current: number; previous: number | null }) {
  const { t } = useI18n()
  if (previous === null || current === 0) return null
  const delta = current - previous
  if (Math.abs(delta) < 0.01) return (
    <span className="flex items-center gap-0.5 text-[10px] text-muted"><Minus className="w-3 h-3" /> {t('dashboard.workout_block.progress.equal')}</span>
  )
  if (delta > 0) return (
    <span className="flex items-center gap-0.5 text-[10px] text-brand-400"><TrendingUp className="w-3 h-3" /> {t('dashboard.workout_block.progress.increase', { delta: delta.toFixed(0) })}</span>
  )
  return (
    <span className="flex items-center gap-0.5 text-[10px] text-red-400"><TrendingDown className="w-3 h-3" /> {t('dashboard.workout_block.progress.decrease', { delta: delta.toFixed(0) })}</span>
  )
}

export default function WorkoutBlock({ workout, exercises, onStart, starting, isLocked, onToggleLock }: Props) {
  const { t } = useI18n()
  const totalVolume = exercises.reduce((a, e) => a + (e.sets || []).reduce((b, s) => b + s.reps * s.weight, 0), 0)
  const hasWorkout = !!workout
  const longPress = useLongPress({ onLongPress: () => onToggleLock?.() })

  return (
    <div className="bento-card flex flex-col h-full relative overflow-hidden select-none [-webkit-touch-callout:none]" {...longPress}>
      {isLocked && (
        <div className="absolute inset-0 z-20 bg-surface-1/60 backdrop-blur-sm flex flex-col items-center justify-center p-4">
          <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-brand-500/20 flex items-center justify-center mb-2">
            <Lock className="w-5 h-5 lg:w-6 lg:h-6 text-brand-400" />
          </div>
          <span className="text-brand-400 font-medium text-xs lg:text-sm">{t('dashboard.workout_block.locked')}</span>
          <span className="text-muted text-[10px] lg:text-xs mt-1 text-center font-medium">{t('dashboard.workout_block.locked_desc')}</span>
        </div>
      )}

      <div className="relative flex items-center justify-center mb-3 lg:mb-4 min-h-[20px]">
        <div className="flex items-center gap-1.5">
          <Dumbbell className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-brand-500" />
          <span className="text-[11px] lg:text-xs font-bold text-muted uppercase tracking-widest">{t('dashboard.workout_block.title')}</span>
        </div>
        {hasWorkout && (
          <div className="absolute right-0 flex items-center gap-1">
            <div className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-brand-500 animate-pulse-dot" />
          </div>
        )}
      </div>

      {!hasWorkout ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 lg:gap-4">
          <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-surface-2 flex items-center justify-center">
            <Dumbbell className="w-5 h-5 lg:w-6 lg:h-6 text-muted" />
          </div>
          <p className="text-xs lg:text-sm text-muted text-center italic px-2">{t('dashboard.workout_block.no_workout')}</p>
          <button onClick={onStart} disabled={starting}
            className="btn-primary text-xs lg:text-sm px-4 lg:px-5 py-2 lg:py-2.5 flex items-center gap-1">
            <Plus className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
            {starting ? t('dashboard.workout_block.creating') : t('dashboard.workout_block.start')}
          </button>
        </div>
      ) : (
        <>
          <div className="flex gap-3 mb-3 lg:mb-4">
            <div className="flex-1 bg-surface-2 rounded-xl p-2 lg:p-3 text-center border border-surface-border/50">
              <div className="text-lg lg:text-xl font-mono font-bold text-brand-500 leading-none mb-1">{exercises.length}</div>
              <div className="text-[9px] lg:text-[10px] text-muted font-bold uppercase tracking-tighter">{t('dashboard.workout_block.exercises_unit')}</div>
            </div>
            <div className="flex-1 bg-surface-2 rounded-xl p-2 lg:p-3 text-center border border-surface-border/50">
              <div className="text-lg lg:text-xl font-mono font-bold text-main leading-none mb-1">
                {totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume}
              </div>
              <div className="text-[9px] lg:text-[10px] text-muted font-bold uppercase tracking-tighter">{t('dashboard.workout_block.volume_unit')}</div>
            </div>
          </div>

          {exercises.length > 0 && (
            <div className="space-y-1 mb-3 lg:mb-4 flex-1 overflow-hidden">
              {exercises.slice(0, 3).map(ex => (
                <div key={ex.id} className="flex items-center justify-between text-xs lg:text-sm py-0.5 lg:py-1">
                  <span className="text-main truncate flex-1 mr-2">{ex.name}</span>
                  <span className="text-muted font-mono flex-shrink-0">{ex.sets?.length || 0}×</span>
                </div>
              ))}
              {exercises.length > 3 && (
                <p className="text-[10px] lg:text-xs text-muted/60 pl-1">{t('dashboard.workout_block.more_count', { count: exercises.length - 3 })}</p>
              )}
            </div>
          )}

          {workout.finished_at ? (
            <div className="flex items-center justify-between bg-brand-500/10 border border-brand-500/20 rounded-xl px-3 lg:px-4 py-2 lg:py-2.5">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-brand-500" />
                <span className="text-xs lg:text-sm font-medium text-brand-400">{t('dashboard.workout_block.completed')}</span>
              </div>
              {workout.started_at && (
                <span className="text-[10px] lg:text-xs font-mono text-muted">
                  {(() => {
                    const ms = new Date(workout.finished_at!).getTime() - new Date(workout.started_at).getTime()
                    const mins = Math.floor(ms / 60000)
                    const h = Math.floor(mins / 60)
                    return h > 0 ? `${h}h ${mins % 60}min` : `${mins} min`
                  })()}
                </span>
              )}
            </div>
          ) : (
            <Link href="/today" className="flex items-center justify-between bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 rounded-xl px-3 lg:px-4 py-2 lg:py-2.5 transition-colors group">
              <span className="text-xs lg:text-sm font-medium text-brand-400">
                {exercises.length === 0 ? t('dashboard.workout_block.add_exercises') : t('dashboard.workout_block.continue_workout')}
              </span>
              <ChevronRight className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-brand-500 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </>
      )}
    </div>
  )
}
