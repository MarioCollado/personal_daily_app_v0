'use client'
import { X, CheckCircle, Clock, Dumbbell, Zap, LayoutTemplate } from 'lucide-react'
import { card, btn } from '@/styles/components'
import type { Workout, Exercise } from '@/types'
import { useState } from 'react'
import SaveTemplateModal from './SaveTemplateModal'

interface Props {
    workout: Workout
    exercises: Exercise[]
    onConfirm: () => void
    onCancel: () => void
    onSaveTemplate: (name: string, exercises: Exercise[]) => Promise<void>
    canSaveTemplate: boolean
}

function formatDuration(started: string): string {
    const ms = Date.now() - new Date(started).getTime()
    const minutes = Math.floor(ms / 60000)
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) return `${hours}h ${mins}min`
    return `${mins} min`
}

export default function WorkoutSummaryModal({ workout, exercises, onConfirm, onCancel, onSaveTemplate, canSaveTemplate }: Props) {
    const totalSets = exercises.reduce((a, e) => a + (e.sets?.length || 0), 0)
    const totalVolume = exercises.reduce((a, e) =>
        a + (e.sets || []).reduce((b, s) => b + s.reps * s.weight, 0), 0)
    const duration = workout.started_at ? formatDuration(workout.started_at) : '—'
    const [showSaveTemplate, setShowSaveTemplate] = useState(false)
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
                    <div className="bg-surface-2 rounded-xl p-3 text-center">
                        <Clock className="w-4 h-4 text-zinc-500 mx-auto mb-1" />
                        <div className="font-mono font-bold text-base">{duration}</div>
                        <div className="text-[10px] text-zinc-600">duración</div>
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
                    <button onClick={onConfirm} className={btn.primary + ' flex-1 flex items-center justify-center gap-2'}>
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