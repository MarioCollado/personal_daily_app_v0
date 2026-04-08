'use client'
import { getGrade } from '@/styles/tokens'
import { card } from '@/styles/components'
import { Flame } from 'lucide-react'
import { clsx } from 'clsx'
import { computeVitalityScore } from '@/lib/vitality'

import type { DailyMetrics, Exercise, UserProfile, WorkoutWithExercises } from '@/types'

interface Props {
  metrics: DailyMetrics | null
  hasWorkout: boolean
  profile: UserProfile | null
  recentMetrics: DailyMetrics[]
  recentWorkouts: WorkoutWithExercises[]
  todayExercises: Exercise[]
}

export default function ScoreBlock({
  metrics,
  hasWorkout,
  profile,
  recentMetrics,
  recentWorkouts,
  todayExercises,
}: Props) {
  const result = computeVitalityScore({
    profile,
    metrics,
    recentMetrics,
    recentWorkouts,
    todayExercises,
    hasWorkout,
  })

  const score = result.score
  const { color } = getGrade(score)

  const R = 26
  const CIRC = 2 * Math.PI * R

  const filled = [
    metrics?.sleep_hours != null,
    metrics?.energy != null,
    (metrics?.pages_read ?? 0) > 0,
    hasWorkout,
    metrics?.free_time != null,
  ].filter(Boolean).length

  const total = 5
  const lowConfidence = result.breakdown.confidence < 0.55

  const bgColor =
    score >= 85
      ? 'bg-lime-400/10'
      : score >= 70
        ? 'bg-green-500/10'
        : score >= 55
          ? 'bg-yellow-400/10'
          : score > 0
            ? 'bg-red-500/10'
            : 'bg-surface-3/40'

  const glow =
    score >= 85
      ? 'shadow-[0_0_25px_rgba(163,230,53,0.35)]'
      : score >= 70
        ? 'shadow-[0_0_18px_rgba(34,197,94,0.25)]'
        : score >= 55
          ? 'shadow-[0_0_14px_rgba(250,204,21,0.25)]'
          : score > 0
            ? 'shadow-[0_0_10px_rgba(239,68,68,0.25)]'
            : ''

  return (
    <div className={clsx(card.bento, bgColor, glow, 'flex flex-col h-full p-4 transition-all')}>
      <div className="relative flex items-center justify-center mb-2 min-h-[20px]">
        <div className="flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[11px] font-bold text-muted uppercase tracking-widest">
            Vitalidad
          </span>
        </div>

        <span className="absolute right-0 text-[10px] text-muted/60">
          {filled}/{total}
        </span>
      </div>

      <div className="flex items-center justify-center flex-1">
        <div className="relative">
          <svg viewBox="0 0 64 64" className="w-20 h-20">
            <circle
              cx="32"
              cy="32"
              r={R}
              fill="none"
              stroke="currentColor"
              className="text-surface-border"
              strokeWidth="6"
            />
            <circle
              cx="32"
              cy="32"
              r={R}
              fill="none"
              stroke={color}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${CIRC}`}
              strokeDashoffset={`${CIRC * (1 - score / 100)}`}
              transform="rotate(-90 32 32)"
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
          </svg>

          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span
              className="text-2xl font-bold font-mono leading-none"
              style={{ color }}
            >
              {score}
            </span>
            <span className="text-[10px] text-muted font-bold tracking-tighter">/100</span>
          </div>
        </div>
      </div>

      <div className={clsx('text-[10px] text-center mt-1 font-medium min-h-[28px]', lowConfidence ? 'text-yellow-300' : 'text-muted')}>
        {result.hint}
      </div>

      {/* <div className="mt-1 flex items-center justify-center gap-2 text-[10px] text-muted/70 font-medium">
        <span>Esfuerzo: {result.breakdown.effort}</span>
        <span>Recuperación: {result.breakdown.recovery}</span>
        <span>Fatiga: {result.breakdown.fatiguePenalty}</span>
      </div> */}
    </div>
  )
}
