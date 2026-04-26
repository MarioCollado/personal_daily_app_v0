'use client'

import Link from 'next/link'
import { ChevronRight, Dumbbell } from 'lucide-react'
import { clsx } from 'clsx'
import type { Exercise, Workout } from '@/types'
import MuscleHighlighter from '@/components/workout/MuscleHighlighter'
import { getTopActivatedMuscle, getWorkoutLoadValue } from '@/lib/workout-insights'

interface Props {
  workout: Workout
  exercises: Exercise[]
  href?: string
  compact?: boolean
  showContinue?: boolean
  className?: string
}

export default function TrainingSummaryCard({
  workout,
  exercises,
  href = '/today',
  compact = false,
  showContinue = true,
  className,
}: Props) {
  const totalSets = exercises.reduce((sum, exercise) => sum + (exercise.sets?.length || 0), 0)
  const trainingLoad = getWorkoutLoadValue(exercises)
  const topMuscle = getTopActivatedMuscle(exercises)

  return (
    <div
      className={clsx(
        'relative overflow-hidden rounded-[28px] border border-surface-border bg-gradient-to-br from-surface-1 via-surface-1 to-surface-2/75 shadow-sm',
        compact ? 'p-3' : 'p-4 sm:p-5',
        className
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(74,222,128,0.08),transparent_40%)]" />

      <div className="relative z-10">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted">Sesion activa</p>
            <p className="mt-1 text-sm font-semibold text-main">{workout.name || 'Entrenamiento en curso'}</p>
          </div>
          <div className="rounded-xl bg-brand-500/12 p-2 text-brand-400">
            <Dumbbell className="h-4 w-4" />
          </div>
        </div>

        <div className={clsx('grid items-center gap-3', compact ? 'grid-cols-[1.1fr_0.9fr]' : 'grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]')}>
          <MuscleHighlighter
            exercises={exercises}
            variant={compact ? 'compact' : 'default'}
            showLegend={!compact}
            className={compact ? 'bg-surface-2/75' : ''}
          />

          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-2xl border border-surface-border bg-surface-2/80 px-3 py-3 text-center">
                <p className="text-lg font-bold font-mono text-brand">{exercises.length}</p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Ejercicios</p>
              </div>
              <div className="rounded-2xl border border-surface-border bg-surface-2/80 px-3 py-3 text-center">
                <p className="text-lg font-bold font-mono text-main">{totalSets}</p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Series</p>
              </div>
              <div className="rounded-2xl border border-surface-border bg-surface-2/80 px-3 py-3 text-center">
                <p className="text-lg font-bold font-mono text-main">{trainingLoad}</p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Carga</p>
              </div>
            </div>

            <div className="rounded-2xl border border-surface-border bg-surface-2/65 px-3 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">Zona dominante</p>
              <p className="mt-1 text-sm font-semibold text-main">{topMuscle?.label || 'Aun sin estimulo suficiente'}</p>
            </div>

            {showContinue && (
              <Link
                href={href}
                className="group flex items-center justify-between rounded-2xl border border-brand-500/20 bg-brand-500/10 px-3.5 py-3 text-sm font-semibold text-brand-300 transition-all hover:bg-brand-500/18 hover:border-brand-500/35"
              >
                <span>Continuar entrenamiento</span>
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
