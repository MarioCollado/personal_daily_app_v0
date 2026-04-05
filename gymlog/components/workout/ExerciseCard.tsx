'use client'
import { useState } from 'react'
import { ChevronDown, ChevronUp, Trash2, Plus, Tag } from 'lucide-react'
import { clsx } from 'clsx'
import type { Exercise, Set } from '@/types'
import { addSet, deleteSet, updateSet, deleteExercise } from '@/lib/db'
import SetRow from './SetRow'

interface Props {
  exercise: Exercise
  onDelete: (id: string) => void
  onSetAdded: (exerciseId: string, set: Set) => void
  onSetDeleted: (exerciseId: string, setId: string) => void
}

const MUSCLE_COLORS: Record<string, string> = {
  pecho: 'bg-red-500/20 text-red-300',
  espalda: 'bg-blue-500/20 text-blue-300',
  piernas: 'bg-purple-500/20 text-purple-300',
  hombros: 'bg-orange-500/20 text-orange-300',
  bíceps: 'bg-yellow-500/20 text-yellow-300',
  tríceps: 'bg-cyan-500/20 text-cyan-300',
  core: 'bg-green-500/20 text-green-300',
}
function getMuscleColor(m?: string | null) {
  if (!m) return 'bg-zinc-500/20 text-zinc-400'
  return MUSCLE_COLORS[m.toLowerCase()] || 'bg-zinc-500/20 text-zinc-400'
}

export default function ExerciseCard({ exercise, onDelete, onSetAdded, onSetDeleted }: Props) {
  const [expanded, setExpanded] = useState(true)
  const [reps, setReps] = useState('')
  const [weight, setWeight] = useState('')
  const [rir, setRir] = useState('')
  const [adding, setAdding] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Pre-fill from last set
  const lastSet = exercise.sets?.[exercise.sets.length - 1]

  async function handleAddSet() {
    const r = parseInt(reps)
    const w = parseFloat(weight)
    if (!r || !w) return
    setAdding(true)
    try {
      const set = await addSet(exercise.id, r, w, rir ? parseInt(rir) : undefined)
      onSetAdded(exercise.id, set)
      // keep values for fast repeat
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    await deleteExercise(exercise.id)
    onDelete(exercise.id)
  }

  const totalVolume = (exercise.sets || []).reduce((acc, s) => acc + s.reps * s.weight, 0)

  return (
    <div className="card overflow-hidden animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 cursor-pointer select-none" onClick={() => setExpanded(e => !e)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-base truncate">{exercise.name}</h3>
            {exercise.muscle_group && (
              <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', getMuscleColor(exercise.muscle_group))}>
                {exercise.muscle_group}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-zinc-500 text-xs">
            <span>{exercise.sets?.length || 0} series</span>
            {totalVolume > 0 && <span>{totalVolume.toLocaleString()} kg vol.</span>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={e => { e.stopPropagation(); handleDelete() }}
            className={clsx('p-2 rounded-lg transition-colors text-xs', confirmDelete ? 'bg-red-500/20 text-red-400' : 'text-zinc-600 hover:text-red-400')}
          >
            {confirmDelete ? 'Confirmar' : <Trash2 className="w-4 h-4" />}
          </button>
          {expanded ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-surface-border">
          {/* Sets list */}
          {(exercise.sets?.length || 0) > 0 && (
            <div className="px-4 pt-3 pb-1">
              {/* Column headers */}
              <div className="grid grid-cols-4 gap-2 text-[11px] text-zinc-600 font-medium uppercase tracking-wider mb-2 px-1">
                <span>#</span><span>Kg</span><span>Reps</span><span>RIR</span>
              </div>
              <div className="space-y-1">
                {exercise.sets!.map((set, i) => (
                  <SetRow key={set.id} set={set} index={i + 1}
                    onDelete={() => onSetDeleted(exercise.id, set.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Add set form */}
          <div className="p-4 pt-3">
            <div className="flex items-center gap-2">
              <input
                type="number" inputMode="decimal" placeholder={lastSet ? String(lastSet.weight) : 'Kg'}
                value={weight} onChange={e => setWeight(e.target.value)}
                className="input-field text-center text-base font-mono"
              />
              <span className="text-zinc-600 font-bold flex-shrink-0">×</span>
              <input
                type="number" inputMode="numeric" placeholder={lastSet ? String(lastSet.reps) : 'Reps'}
                value={reps} onChange={e => setReps(e.target.value)}
                className="input-field text-center text-base font-mono"
                onKeyDown={e => e.key === 'Enter' && handleAddSet()}
              />
              <input
                type="number" inputMode="numeric" placeholder="RIR"
                value={rir} onChange={e => setRir(e.target.value)}
                className="input-field text-center text-sm w-16 flex-shrink-0"
              />
              <button onClick={handleAddSet} disabled={adding || !reps || !weight}
                className="btn-primary flex-shrink-0 px-3 py-2.5 disabled:opacity-40">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
