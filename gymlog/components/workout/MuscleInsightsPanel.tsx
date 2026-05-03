'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, Activity } from 'lucide-react'
import { clsx } from 'clsx'
import type { Exercise, Workout } from '@/types'
import { buildMuscleActivation } from '@/lib/workout-insights'
import MuscleHighlighter from '@/components/workout/MuscleHighlighter'
import WeeklySparkline from '@/components/workout/WeeklySparkline'

interface Props {
  exercises: Exercise[]
  workouts: (Workout & { exercises?: Exercise[] })[]
  currentDate: string
}

export default function MuscleInsightsPanel({ exercises, workouts, currentDate }: Props) {
  const [open, setOpen] = useState(false)

  const topMuscles = useMemo(() => buildMuscleActivation(exercises).slice(0, 3), [exercises])

  return (
    <section className="rounded-[28px] border border-surface-border bg-surface-1 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(prev => !prev)}
        className="w-full flex items-center justify-between gap-3 p-4 text-left"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-brand-500/12 flex items-center justify-center flex-shrink-0">
              <Activity className="w-4 h-4 text-brand-400" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">Insights</p>
              <p className="mt-0.5 text-sm font-semibold text-main">Ver musculos trabajados</p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {topMuscles.length > 0 ? topMuscles.map(muscle => (
              <span
                key={muscle.slug}
                className="rounded-full border border-surface-border bg-surface-2 px-2.5 py-1 text-[11px] font-medium text-main"
              >
                {muscle.label}
              </span>
            )) : (
              <span className="text-[11px] text-muted">Anade ejercicios para ver activacion muscular.</span>
            )}
          </div>
        </div>

        <ChevronDown className={clsx('w-4 h-4 text-muted transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="border-t border-surface-border px-4 pb-4 animate-slide-up">
          <div className="pt-4">
            <MuscleHighlighter
              exercises={exercises}
              variant="compact"
              showLegend={false}
              showHint={false}
              className="bg-surface-2/70"
            />
          </div>

          <div className="mt-4 rounded-2xl border border-surface-border bg-surface-2/65 p-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted mb-3">Ritmo reciente</p>
            <WeeklySparkline workouts={workouts} currentDate={currentDate} />
          </div>
        </div>
      )}
    </section>
  )
}
