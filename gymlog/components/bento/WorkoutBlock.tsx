'use client'
import { Dumbbell, TrendingUp, TrendingDown, Minus, ChevronRight, Plus, Lock } from 'lucide-react'
import Link from 'next/link'
import type { Workout, Exercise } from '@/types'
import { clsx } from 'clsx'
import { useLongPress } from '@/hooks/useLongPress'

interface Props {
  workout: Workout | null
  exercises: Exercise[]
  onStart: () => void
  starting?: boolean
  isLocked?: boolean
  onToggleLock?: () => void
}

function ProgressBadge({ current, previous }: { current: number; previous: number | null }) {
  if (previous === null || current === 0) return null
  const delta = current - previous
  if (Math.abs(delta) < 0.01) return (
    <span className="flex items-center gap-0.5 text-[10px] text-zinc-500"><Minus className="w-3 h-3" /> igual</span>
  )
  if (delta > 0) return (
    <span className="flex items-center gap-0.5 text-[10px] text-brand-400"><TrendingUp className="w-3 h-3" /> +{delta.toFixed(0)} kg</span>
  )
  return (
    <span className="flex items-center gap-0.5 text-[10px] text-red-400"><TrendingDown className="w-3 h-3" /> {delta.toFixed(0)} kg</span>
  )
}

export default function WorkoutBlock({ workout, exercises, onStart, starting, isLocked, onToggleLock }: Props) {
  const totalSets = exercises.reduce((a, e) => a + (e.sets?.length || 0), 0)
  const totalVolume = exercises.reduce((a, e) => a + (e.sets || []).reduce((b, s) => b + s.reps * s.weight, 0), 0)
  const hasWorkout = !!workout
  const longPress = useLongPress({ onLongPress: () => onToggleLock?.() })

  return (
    <div className="bento-card flex flex-col h-full relative overflow-hidden select-none [-webkit-touch-callout:none]" {...longPress}>
      {isLocked && (
        <div className="absolute inset-0 z-20 bg-surface-1/60 backdrop-blur-sm flex flex-col items-center justify-center p-4">
          <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center mb-2">
            <Lock className="w-5 h-5 text-brand-400" />
          </div>
          <span className="text-brand-400 font-medium text-xs">Bloqueado</span>
          <span className="text-zinc-500 text-[10px] mt-1 text-center">Mantén pulsado para abrir</span>
        </div>
      )}

      <div className="relative flex items-center justify-center mb-3 min-h-[20px]">
        <div className="flex items-center gap-1.5">
          <Dumbbell className="w-3.5 h-3.5 text-brand-500" />
          <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-widest">Entreno</span>
        </div>
        {hasWorkout && (
          <div className="absolute right-0 flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse-dot" />
          </div>
        )}
      </div>

      {!hasWorkout ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-zinc-600" />
          </div>
          <p className="text-xs text-zinc-600 text-center">Sin entreno hoy</p>
          <button onClick={onStart} disabled={starting}
            className="btn-primary text-xs px-4 py-2 flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" />
            {starting ? 'Creando...' : 'Empezar'}
          </button>
        </div>
      ) : (
        <>
          {/* Stats row */}
          <div className="flex gap-3 mb-3">
            <div className="flex-1 bg-surface-2 rounded-xl p-2 text-center">
              <div className="text-lg font-mono font-bold text-brand-400">{exercises.length}</div>
              <div className="text-[10px] text-zinc-600">ejerc.</div>
            </div>
            <div className="flex-1 bg-surface-2 rounded-xl p-2 text-center">
              <div className="text-lg font-mono font-bold">{totalSets}</div>
              <div className="text-[10px] text-zinc-600">series</div>
            </div>
            <div className="flex-1 bg-surface-2 rounded-xl p-2 text-center">
              <div className="text-lg font-mono font-bold">
                {totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume}
              </div>
              <div className="text-[10px] text-zinc-600">vol. kg</div>
            </div>
          </div>

          {/* Exercise list preview */}
          {exercises.length > 0 && (
            <div className="space-y-1 mb-3 flex-1 overflow-hidden">
              {exercises.slice(0, 3).map(ex => (
                <div key={ex.id} className="flex items-center justify-between text-xs">
                  <span className="text-zinc-300 truncate flex-1 mr-2">{ex.name}</span>
                  <span className="text-zinc-600 font-mono flex-shrink-0">{ex.sets?.length || 0}×</span>
                </div>
              ))}
              {exercises.length > 3 && (
                <p className="text-[10px] text-zinc-700">+{exercises.length - 3} más</p>
              )}
            </div>
          )}

          {/* CTA */}
          <Link href="/today" className="flex items-center justify-between bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 rounded-xl px-3 py-2 transition-colors group">
            <span className="text-xs font-medium text-brand-400">
              {exercises.length === 0 ? 'Añadir ejercicios' : 'Continuar entreno'}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-brand-500 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </>
      )}
    </div>
  )
}
