'use client'
import { useState } from 'react'
import { ChevronDown, ChevronUp, Trash2, Plus, Timer } from 'lucide-react'
import { clsx } from 'clsx'
import { addSet, deleteExercise } from '@/lib/db'
import { getMuscleGroupStyle } from '@/styles/tokens'
import { card, btn, input, setRow, text, cardio } from '@/styles/components'
import SetRow from './SetRow'
import CardioSetRow from './CardioSetRow'
import type { Exercise, Set } from '@/types'
import { useI18n } from '@/contexts/I18nContext'

interface Props {
  exercise: Exercise
  onDelete: (id: string) => void
  onSetAdded: (exerciseId: string, set: Set) => void
  onSetDeleted: (exerciseId: string, setId: string) => void
}

const IS_CARDIO = (mg: string | null) => mg?.toLowerCase() === 'cardio'

function parseTime(val: string): number | null {
  const trimmed = val.trim()
  if (!trimmed) return null
  if (!trimmed.includes(':')) {
    const mins = parseFloat(trimmed)
    return isNaN(mins) ? null : Math.round(mins * 60)
  }
  const parts = trimmed.split(':').map(Number)
  if (parts.some(isNaN)) return null
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  return null
}

function calcPace(durationSec: number, distKm: number): string | null {
  if (!distKm || distKm <= 0) return null
  const paceSecPerKm = durationSec / distKm
  const m = Math.floor(paceSecPerKm / 60)
  const s = Math.round(paceSecPerKm % 60)
  return `${m}:${String(s).padStart(2, '0')} / km`
}

export default function ExerciseCard({ exercise, onDelete, onSetAdded, onSetDeleted }: Props) {
  const { t } = useI18n()
  const isCardio = IS_CARDIO(exercise.muscle_group)

  const [reps, setReps] = useState('')
  const [weight, setWeight] = useState('')
  const [rir, setRir] = useState('')

  const [distance, setDistance] = useState('')
  const [duration, setDuration] = useState('')

  const [expanded, setExpanded] = useState(false)
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const distNum = parseFloat(distance)
  const durSec = parseTime(duration)
  const livePace = durSec && distNum > 0 ? calcPace(durSec, distNum) : null

  const lastSet = exercise.sets?.[exercise.sets.length - 1]

  const totalVolume = isCardio
    ? null
    : (exercise.sets || []).reduce((a, s) => a + s.reps * s.weight, 0)

  const totalDist = isCardio
    ? (exercise.sets || []).reduce((a, s) => a + (s.distance_km ?? 0), 0)
    : null

  async function handleAddSet() {
    setAddError(null)
    if (isCardio) {
      if (!durSec) return
      const safeDist = distNum > 0 ? distNum : 0
      setAdding(true)
      try {
        const set = await addSet(exercise.id, 0, 0, undefined, undefined, safeDist || undefined, durSec)
        onSetAdded(exercise.id, set)
        setDistance('')
        setDuration('')
      } catch (e: any) {
        setAddError(e?.message || 'Error.')
      } finally { setAdding(false) }
    } else {
      const r = parseInt(reps)
      const w = parseFloat(weight)
      if (!r || !w) return
      setAdding(true)
      try {
        const set = await addSet(exercise.id, r, w, rir ? parseInt(rir) : undefined)
        onSetAdded(exercise.id, set)
        setReps('')
        setWeight('')
        setRir('')
      } catch (e: any) {
        setAddError(e?.message || 'Error.')
      } finally { setAdding(false) }
    }
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    await deleteExercise(exercise.id)
    onDelete(exercise.id)
  }

  return (
    <div className={card.base + ' overflow-hidden animate-slide-up'}>
      <div className="flex items-center gap-3 p-4 cursor-pointer select-none"
        onClick={() => setExpanded(e => !e)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-base truncate text-main">{exercise.name}</h3>
            {exercise.muscle_group && (() => {
              const style = getMuscleGroupStyle(exercise.muscle_group)
              return (
                <span
                  style={{ backgroundColor: style.bg, color: style.text }}
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                >
                  {exercise.muscle_group}
                </span>
              )
            })()}
          </div>

          {/* <div className="flex items-center gap-3 mt-0.5 text-muted text-xs">
            {isCardio ? (
              <>
                <span>{t('workout.exercise_card.records_unit', { count: exercise.sets?.length || 0 })}</span>
                {(totalDist ?? 0) > 0 && <span>{t('workout.exercise_card.total_km', { count: (totalDist ?? 0).toFixed(1) })}</span>}
              </>
            ) : (
              <>
                <span>{t('workout.exercise_card.sets_unit', { count: exercise.sets?.length || 0 })}</span>
                {(totalVolume ?? 0) > 0 && <span>{t('workout.exercise_card.volume_kg_short', { count: (totalVolume ?? 0).toLocaleString() })}</span>}
              </>
            )}
          </div> */}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={e => { e.stopPropagation(); handleDelete() }}
            className={clsx(
              'p-2 rounded-lg transition-colors text-xs',
              confirmDelete
                ? 'bg-red-500/20 text-red-400'
                : 'text-muted hover:text-red-400'
            )}
          >
            {confirmDelete ? t('workout.exercise_card.confirm') : <Trash2 className="w-4 h-4" />}
          </button>

          {expanded
            ? <ChevronUp className="w-4 h-4 text-muted" />
            : <ChevronDown className="w-4 h-4 text-muted" />}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-surface-border">

          {(exercise.sets?.length || 0) > 0 && (
            <div className="px-4 pt-3 pb-1">
              {isCardio ? (
                <>
                  <div className={clsx(setRow.header, 'grid-cols-4')}>
                    <span>#</span><span>Dist.</span><span>Tiempo</span><span>Ritmo</span>
                  </div>
                  <div className="space-y-1">
                    {exercise.sets!.map((s, i) => (
                      <CardioSetRow
                        key={s.id}
                        set={s}
                        index={i + 1}
                        onDelete={() => onSetDeleted(exercise.id, s.id)}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className={setRow.header}>
                    <span>#</span><span>Kg</span><span>Reps</span><span>RIR</span>
                  </div>
                  <div className="space-y-1">
                    {exercise.sets!.map((s, i) => (
                      <SetRow
                        key={s.id}
                        set={s}
                        index={i + 1}
                        onDelete={() => onSetDeleted(exercise.id, s.id)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="p-4 pt-3">
            {isCardio ? (
              <div className="space-y-3">

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={text.label + ' block mb-1'}>{t('workout.exercise_card.distance')}</label>
                    <div className="relative">
                      <input
                        type="number"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={distance}
                        onChange={e => setDistance(e.target.value)}
                        className={input.cardio}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">km</span>
                    </div>
                  </div>

                  <div>
                    <label className={text.label + ' block mb-1'}>{t('workout.exercise_card.time')}</label>
                    <input
                      type="text"
                      placeholder="mm:ss o minutos"
                      value={duration}
                      onChange={e => setDuration(e.target.value)}
                      className={input.cardio}
                      onKeyDown={e => e.key === 'Enter' && handleAddSet()}
                    />
                  </div>
                </div>

                <div className={clsx(cardio.paceDisplay, livePace ? 'opacity-100' : 'opacity-30')}>
                  <Timer className="w-4 h-4 text-sky-400" />
                  <div>
                    <div className={cardio.paceLabel}>{t('workout.exercise_card.pace')}</div>
                    <span className={cardio.paceValue}>{livePace ?? '—'}</span>
                  </div>
                </div>

                <button
                  onClick={handleAddSet}
                  disabled={adding || !durSec}
                  className={clsx(btn.primary, 'w-full flex items-center justify-center gap-2 disabled:opacity-40')}
                >
                  <Plus className="w-4 h-4" />
                  {adding ? t('workout.exercise_card.saving') : t('workout.exercise_card.register')}
                </button>

                {addError && (
                  <p className="text-xs text-red-400 mt-1 text-center">{addError}</p>
                )}

              </div>
            ) : (

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder={lastSet ? String(lastSet.weight) : t('workout.exercise_card.weight_placeholder')}
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  className="h-11 w-full rounded-xl bg-surface-2 text-main text-center text-base font-mono px-3 border border-surface-border focus:border-brand-500 outline-none transition-colors"
                />

                <span className="text-muted font-bold flex-shrink-0">×</span>

                <input
                  type="number"
                  inputMode="numeric"
                  placeholder={lastSet ? String(lastSet.reps) : t('workout.exercise_card.reps_placeholder')}
                  value={reps}
                  onChange={e => setReps(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddSet()}
                  className="h-11 w-full rounded-xl bg-surface-2 text-main text-center text-base font-mono px-3 border border-surface-border focus:border-brand-500 outline-none transition-colors"
                />

                <input
                  type="number"
                  inputMode="numeric"
                  placeholder={t('workout.exercise_card.rir_placeholder')}
                  value={rir}
                  onChange={e => setRir(e.target.value)}
                  className="h-11 w-16 rounded-xl bg-surface-2 text-main text-center text-sm px-2 flex-shrink-0 border border-surface-border focus:border-brand-500 outline-none transition-colors"
                />

                <button
                  onClick={handleAddSet}
                  disabled={adding || !reps || !weight}
                  className="h-11 px-3 rounded-xl bg-brand-500 text-brand-foreground flex items-center justify-center disabled:opacity-40 hover:bg-brand-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

            )}
          </div>
        </div>
      )}
    </div>
  )
}