'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Trash2, Timer } from 'lucide-react'
import { clsx } from 'clsx'
import { addSet, deleteExercise, getLastExerciseSession } from '@/lib/db'
import { getSuggestedStrengthValues, summarizePreviousStrengthSets } from '@/lib/workout-autofill'
import { getMuscleGroupStyle } from '@/styles/tokens'
import { card, btn, input, setRow, text, cardio } from '@/styles/components'
import SetRow from './SetRow'
import CardioSetRow from './CardioSetRow'
import TimeSetRow from './TimeSetRow'
import StrengthSetComposer from './StrengthSetComposer'
import TimeSetComposer from './TimeSetComposer'
import TimeExerciseCard from './TimeExerciseCard'
import type { Exercise, Set } from '@/types'
import { useI18n } from '@/contexts/I18nContext'
import { calculateWarmup } from '@/lib/warmup-calculator'

interface Props {
  exercise: Exercise
  userId?: string | null
  onDelete: (id: string) => void
  onSetAdded: (exerciseId: string, set: Set) => void
  onSetDeleted: (exerciseId: string, setId: string) => void
}

const GET_EXERCISE_TYPE = (ex: Exercise) => {
  if (ex.type) return ex.type
  if (ex.muscle_group?.toLowerCase() === 'cardio') return 'cardio'
  return 'strength'
}

function parseTime(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  if (!trimmed.includes(':')) {
    const mins = parseFloat(trimmed)
    return Number.isNaN(mins) ? null : Math.round(mins * 60)
  }

  const parts = trimmed.split(':').map(Number)
  if (parts.some(Number.isNaN)) return null
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  return null
}

function calcPace(durationSec: number, distanceKm: number): string | null {
  if (!distanceKm || distanceKm <= 0) return null
  const paceSecPerKm = durationSec / distanceKm
  const mins = Math.floor(paceSecPerKm / 60)
  const seconds = Math.round(paceSecPerKm % 60)
  return `${mins}:${String(seconds).padStart(2, '0')} / km`
}

export default function ExerciseCard({ exercise, userId, onDelete, onSetAdded, onSetDeleted }: Props) {
  const { t } = useI18n()
  const exerciseType = GET_EXERCISE_TYPE(exercise)
  const isCardio = exerciseType === 'cardio'
  const isTime = exerciseType === 'time'

  const [reps, setReps] = useState('')
  const [weight, setWeight] = useState('')
  const [rir, setRir] = useState('')
  const [distance, setDistance] = useState('')
  const [duration, setDuration] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [previousSets, setPreviousSets] = useState<Set[]>([])
  const [loadingPrevious, setLoadingPrevious] = useState(false)
  const [previousLookupDone, setPreviousLookupDone] = useState(false)

  const distanceNumber = parseFloat(distance)
  const durationSeconds = parseTime(duration)
  const livePace = durationSeconds && distanceNumber > 0 ? calcPace(durationSeconds, distanceNumber) : null
  const lastSet = exercise.sets?.[exercise.sets.length - 1]
  const currentSetIndex = exercise.sets?.length || 0

  const previousSuggestion = useMemo(
    () => getSuggestedStrengthValues(previousSets, currentSetIndex),
    [previousSets, currentSetIndex]
  )

  const previousSummary = useMemo(
    () => summarizePreviousStrengthSets(previousSets),
    [previousSets]
  )

  const warmupSets = useMemo(
    () => calculateWarmup(previousSets[0]?.weight),
    [previousSets]
  )

  useEffect(() => {
    if (isCardio || isTime || !userId || previousLookupDone) return

    let cancelled = false
    setLoadingPrevious(true)

    getLastExerciseSession(userId, exercise.name, exercise.workout_id)
      .then(sets => {
        if (!cancelled) {
          setPreviousSets(sets)
          setPreviousLookupDone(true)
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingPrevious(false)
      })

    return () => {
      cancelled = true
    }
  }, [expanded, isCardio, userId, previousLookupDone, exercise.name, exercise.workout_id])

  useEffect(() => {
    if (isCardio || isTime || !expanded || !previousSuggestion) return
    setWeight(previousSuggestion.weight)
    setReps(previousSuggestion.reps)
    setRir(previousSuggestion.rir)
  }, [expanded, isCardio, previousSuggestion])

  async function handleAddSet(overrideDuration?: number) {
    setAddError(null)

    if (isCardio || isTime) {
      const durationSec = overrideDuration ?? parseTime(duration)
      if (!durationSec) return
      const safeDistance = isCardio ? (distanceNumber > 0 ? distanceNumber : 0) : undefined
      setAdding(true)

      try {
        const set = await addSet(exercise.id, 0, 0, undefined, undefined, safeDistance, durationSec)
        onSetAdded(exercise.id, set)
        setDistance('')
        setDuration('')
      } catch (error: any) {
        setAddError(error?.message || 'Error.')
      } finally {
        setAdding(false)
      }
      return
    }

    const parsedReps = parseInt(reps)
    const parsedWeight = parseFloat(weight)
    if (!parsedReps || !parsedWeight) return

    setAdding(true)
    try {
      const set = await addSet(exercise.id, parsedReps, parsedWeight, rir ? parseInt(rir) : undefined)
      onSetAdded(exercise.id, set)
      setReps('')
      setWeight('')
      setRir('')
    } catch (error: any) {
      setAddError(error?.message || 'Error.')
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }

    await deleteExercise(exercise.id)
    onDelete(exercise.id)
  }

  function resetSuggestedValues() {
    setWeight('')
    setReps('')
    setRir('')
  }

  return (
    <div className={card.base + ' overflow-hidden animate-slide-up'}>
      <div
        className="flex items-center gap-3 p-4 cursor-pointer select-none"
        onClick={() => setExpanded(value => !value)}
      >
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

          {warmupSets.length > 0 && (
            <div className="mt-1 flex items-center gap-1.5 text-[10px] font-bold text-muted uppercase tracking-[0.12em]">
              <span className="opacity-70">Aproximación:</span>
              <div className="flex items-center gap-1.5 text-main/90 font-mono">
                {warmupSets.map((ws, i) => (
                  <span key={i} className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setWeight(String(ws.weight))
                        if (!expanded) setExpanded(true)
                      }}
                      className={clsx(
                        "px-1.5 py-0.5 rounded bg-surface-2/80 border border-surface-border transition-colors hover:border-brand-500/50 hover:bg-surface-3",
                        i === warmupSets.length - 1 && "text-brand-400 border-brand-500/20 bg-brand-500/5"
                      )}
                    >
                      {ws.weight}
                    </button>
                    {i < warmupSets.length - 1 && <span className="opacity-30">→</span>}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={event => {
              event.stopPropagation()
              handleDelete()
            }}
            className={clsx(
              'p-2 rounded-lg transition-colors text-xs',
              confirmDelete ? 'bg-red-500/20 text-red-400' : 'text-muted hover:text-red-400'
            )}
          >
            {confirmDelete ? t('workout.exercise_card.confirm') : <Trash2 className="w-4 h-4" />}
          </button>

          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-surface-border">
          {isTime ? (
            <div className="p-4">
              <TimeExerciseCard
                exercise={exercise}
                onAddSet={(sec) => handleAddSet(sec)}
                onDeleteSet={(setId) => onSetDeleted(exercise.id, setId)}
                addError={addError}
              />
            </div>
          ) : (
            <>
              {(exercise.sets?.length || 0) > 0 && (
                <div className="px-4 pt-3 pb-1">
                  {isCardio ? (
                    <>
                      <div className={clsx(setRow.header, 'grid-cols-4')}>
                        <span>#</span><span>Dist.</span><span>Tiempo</span><span>Ritmo</span>
                      </div>
                      <div className="space-y-1">
                        {exercise.sets!.map((set, index) => (
                          <CardioSetRow
                            key={set.id}
                            set={set}
                            index={index + 1}
                            onDelete={() => onSetDeleted(exercise.id, set.id)}
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
                        {exercise.sets!.map((set, index) => (
                          <SetRow
                            key={set.id}
                            set={set}
                            index={index + 1}
                            onDelete={() => onSetDeleted(exercise.id, set.id)}
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
                            onChange={event => setDistance(event.target.value)}
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
                          onChange={event => setDuration(event.target.value)}
                          className={input.cardio}
                          onKeyDown={event => event.key === 'Enter' && handleAddSet()}
                        />
                      </div>
                    </div>

                    <div className={clsx(cardio.paceDisplay, livePace ? 'opacity-100' : 'opacity-30')}>
                      <Timer className="w-4 h-4 text-sky-400" />
                      <div>
                        <div className={cardio.paceLabel}>{t('workout.exercise_card.pace')}</div>
                        <span className={cardio.paceValue}>{livePace ?? '-'}</span>
                      </div>
                    </div>

                    <button
                      onClick={handleAddSet}
                      disabled={adding || !durationSeconds}
                      className={clsx(btn.primary, 'w-full flex items-center justify-center gap-2 disabled:opacity-40')}
                    >
                      {adding ? t('workout.exercise_card.saving') : t('workout.exercise_card.register')}
                    </button>

                    {addError && (
                      <p className="text-xs text-red-400 mt-1 text-center">{addError}</p>
                    )}
                  </div>
                ) : (
                  <StrengthSetComposer
                    weight={weight}
                    reps={reps}
                    rir={rir}
                    onWeightChange={setWeight}
                    onRepsChange={setReps}
                    onRirChange={setRir}
                    onSubmit={handleAddSet}
                    onReset={resetSuggestedValues}
                    adding={adding}
                    loadingPrevious={loadingPrevious}
                    suggestionSummary={previousSummary || undefined}
                    weightPlaceholder={lastSet ? String(lastSet.weight) : t('workout.exercise_card.weight_placeholder')}
                    repsPlaceholder={lastSet ? String(lastSet.reps) : t('workout.exercise_card.reps_placeholder')}
                    rirPlaceholder={t('workout.exercise_card.rir_placeholder')}
                  />
                )}

                {addError && !isCardio && (
                  <p className="text-xs text-red-400 mt-2 text-center">{addError}</p>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
