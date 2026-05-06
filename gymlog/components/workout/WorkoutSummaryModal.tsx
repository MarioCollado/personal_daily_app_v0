'use client'
import { X, CheckCircle, Clock, Dumbbell, Zap, LayoutTemplate } from 'lucide-react'
import { card, btn } from '@/styles/components'
import type { Workout, Exercise } from '@/types'
import { useState } from 'react'
import SaveTemplateModal from './SaveTemplateModal'

interface Props {
    workout: Workout
    exercises: Exercise[]
    onConfirm: (durationMinutes: number) => void
    onCancel: () => void
    onSaveTemplate: (name: string, exercises: Exercise[]) => Promise<void>
    canSaveTemplate: boolean
}

export default function WorkoutSummaryModal({ workout, exercises, onConfirm, onCancel, onSaveTemplate, canSaveTemplate }: Props) {
    const totalSets = exercises.reduce((a, e) => a + (e.sets?.length || 0), 0)
    const totalVolume = exercises.reduce((a, e) =>
        a + (e.sets || []).reduce((b, s) => b + s.reps * s.weight, 0), 0)
    
    const [showSaveTemplate, setShowSaveTemplate] = useState(false)

    const [durationMinutes, setDurationMinutes] = useState(() => {
        let elapsed = 0
        if (workout.started_at) {
            elapsed = Math.floor((Date.now() - new Date(workout.started_at).getTime()) / 60000)
        }

        const cardioSeconds = exercises.reduce((a, e) =>
            a + (e.sets || []).reduce((b, s) => b + (s.duration_seconds || 0), 0), 0)
        const cardioMinutes = Math.floor(cardioSeconds / 60)

        return Math.max(elapsed, cardioMinutes, 1)
    })

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm">
            <div className={card.base + ' rounded-t-2xl w-full max-w-lg p-5 animate-slide-up'}>

                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-brand-500" />
                        <h3 className="font-semibold text-lg">Finalizar entreno</h3>
                    </div>
                    <button onClick={onCancel} className={btn.icon}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                    <div className="bg-surface-2 rounded-xl p-2 text-center flex flex-col justify-center">
                        <Clock className="w-4 h-4 text-zinc-500 mx-auto mb-1" />
                        <div className="flex items-center justify-center gap-1">
                            <input 
                                type="number" 
                                min="1"
                                value={durationMinutes}
                                onChange={e => setDurationMinutes(parseInt(e.target.value) || 0)}
                                className="w-12 bg-surface-0 border border-surface-border rounded-md px-1 py-0.5 text-center font-mono font-bold text-base text-main focus:outline-none focus:border-brand-500 transition-colors"
                            />
                            <span className="font-mono text-xs text-muted">m</span>
                        </div>
                        <div className="text-[10px] text-zinc-600 mt-1">duración</div>
                    </div>
                    <div className="bg-surface-2 rounded-xl p-3 text-center">
                        <Dumbbell className="w-4 h-4 text-zinc-500 mx-auto mb-1" />
                        <div className="font-mono font-bold text-base">{totalSets}</div>
                        <div className="text-[10px] text-zinc-600">series</div>
                    </div>
                    <div className="bg-surface-2 rounded-xl p-3 text-center">
                        <Zap className="w-4 h-4 text-zinc-500 mx-auto mb-1" />
                        <div className="font-mono font-bold text-base">
                            {totalVolume >= 1000
                                ? `${(totalVolume / 1000).toFixed(1)}k`
                                : totalVolume}
                        </div>
                        <div className="text-[10px] text-zinc-600">kg vol.</div>
                    </div>
                </div>

                {/* Exercise list */}
                {exercises.length > 0 && (
                    <div className="mb-5 space-y-1 max-h-40 overflow-y-auto">
                        {exercises.map(ex => (
                            <div key={ex.id} className="flex items-center justify-between text-sm py-1 border-b border-surface-border last:border-0">
                                <span className="text-zinc-300 truncate flex-1">{ex.name}</span>
                                <span className="text-zinc-600 font-mono ml-2 flex-shrink-0">
                                    {ex.sets?.length || 0} series
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Guardar como plantilla */}
                {canSaveTemplate && (
                    <button
                        onClick={() => setShowSaveTemplate(true)}
                        className="w-full flex items-center justify-center gap-2 text-xs text-zinc-500 hover:text-brand-400 transition-colors py-2 border border-surface-border hover:border-brand-500/30 rounded-xl mb-3"
                    >
                        <LayoutTemplate className="w-3.5 h-3.5" />
                        Guardar como plantilla
                    </button>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                    <button onClick={onCancel} className={btn.ghost + ' flex-1'}>
                        Cancelar
                    </button>
                    <button onClick={() => onConfirm(durationMinutes)} className={btn.primary + ' flex-1 flex items-center justify-center gap-2'}>
                        <CheckCircle className="w-4 h-4" />
                        Confirmar
                    </button>
                </div>

                {/* Modal guardar plantilla */}
                {showSaveTemplate && (
                    <SaveTemplateModal
                        exercises={exercises}
                        onSave={onSaveTemplate}
                        onClose={() => setShowSaveTemplate(false)}
                    />
                )}
            </div>
        </div>
    )
}