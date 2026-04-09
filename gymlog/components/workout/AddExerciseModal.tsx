'use client'
import { useState, useRef, useEffect } from 'react'
import { X, Plus } from 'lucide-react'
import { addExercise } from '@/lib/db'
import type { Exercise } from '@/types'
import { clsx } from 'clsx'
import { useI18n } from '@/contexts/I18nContext'

interface Props {
  workoutId: string
  suggestions: string[]
  onAdd: (exercise: Exercise) => void
  onClose: () => void
}

export default function AddExerciseModal({ workoutId, suggestions, onAdd, onClose }: Props) {
  const { t } = useI18n()
  const [name, setName] = useState('')
  const [muscleGroup, setMuscleGroup] = useState('')
  const [loading, setLoading] = useState(false)
  const [filtered, setFiltered] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const MUSCLE_GROUPS = [
    { key: 'chest', label: t('workout.muscle_groups.chest') },
    { key: 'back', label: t('workout.muscle_groups.back') },
    { key: 'legs', label: t('workout.muscle_groups.legs') },
    { key: 'shoulders', label: t('workout.muscle_groups.shoulders') },
    { key: 'biceps', label: t('workout.muscle_groups.biceps') },
    { key: 'triceps', label: t('workout.muscle_groups.triceps') },
    { key: 'core', label: t('workout.muscle_groups.core') },
    { key: 'glutes', label: t('workout.muscle_groups.glutes') },
    { key: 'cardio', label: t('workout.muscle_groups.cardio') },
  ]

  useEffect(() => { inputRef.current?.focus() }, [])

  function handleNameChange(val: string) {
    setName(val)
    if (val.length > 1) {
      setFiltered(suggestions.filter(s => s.toLowerCase().includes(val.toLowerCase())).slice(0, 5))
    } else {
      setFiltered([])
    }
  }

  async function handleSubmit() {
    if (!name.trim()) return
    setLoading(true)
    try {
      const ex = await addExercise(workoutId, name.trim(), muscleGroup || undefined)
      onAdd(ex)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface-1 border border-surface-border rounded-t-2xl w-full max-w-lg p-5 animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5 px-1">
          <h3 className="font-semibold text-lg text-main">{t('workout.modal.title')}</h3>
          <button onClick={onClose} className="text-muted hover:text-main p-1 transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              placeholder={t('workout.modal.placeholder')}
              value={name}
              onChange={e => handleNameChange(e.target.value)}
              className="input-field"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
            {filtered.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-surface-2 border border-surface-border rounded-xl overflow-hidden z-10 shadow-xl">
                {filtered.map(s => (
                  <button key={s} onClick={() => { setName(s); setFiltered([]) }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-surface-3 text-main transition-colors border-b border-surface-border last:border-0">
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-xs text-muted mb-2 font-semibold uppercase tracking-wider">{t('workout.modal.optional')}</p>
            <div className="flex flex-wrap gap-2">
              {MUSCLE_GROUPS.map(({ key, label }) => (
                <button key={key} onClick={() => setMuscleGroup(muscleGroup === label ? '' : label)}
                  className={clsx('px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200', muscleGroup === label ? 'bg-brand-500 text-brand-foreground shadow-sm' : 'bg-surface-3 text-muted hover:bg-surface-4 hover:text-main')}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleSubmit} disabled={loading || !name.trim()}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-2 disabled:opacity-40">
            <Plus className="w-4 h-4" />
            {loading ? t('workout.modal.adding') : t('workout.modal.add_button')}
          </button>
        </div>
      </div>
    </div>
  )
}
