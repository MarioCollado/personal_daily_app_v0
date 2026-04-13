'use client'
import { useState } from 'react'
import { X, LayoutTemplate, Check } from 'lucide-react'
import { card, btn, input } from '@/styles/components'
import type { Exercise } from '@/types'
import { useI18n } from '@/contexts/I18nContext'

interface Props {
    exercises: Exercise[]
    onSave: (name: string, filteredExercises: Exercise[]) => Promise<void>
    onClose: () => void
}

export default function SaveTemplateModal({ exercises, onSave, onClose }: Props) {
    const { t, language } = useI18n()

    const [name, setName] = useState('')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Filtrar solo ejercicios de fuerza (sin cardio puro)
    const validExercises = exercises.filter(ex =>
        ex.name && ex.muscle_group?.toLowerCase() !== 'cardio'
            ? true
            : ex.name
    )

    async function handleSave() {
        if (!name.trim() || validExercises.length === 0) return
        setSaving(true)
        setError(null)
        try {
            await onSave(name.trim(), validExercises)
            onClose()
        } catch (e: any) {
            setError(e.message ?? 'Error al guardar la plantilla')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className={card.base + ' rounded-t-2xl w-full max-w-lg p-5 animate-slide-up'}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                        <LayoutTemplate className="w-5 h-5 text-brand-500" />
                        <h3 className="font-semibold text-lg">{t('today_page.save_template')}</h3>
                    </div>
                    <button onClick={onClose} className={btn.icon}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Nombre */}
                <div className="mb-4">
                    <label className="text-xs text-zinc-500 font-medium mb-1.5 block">
                        {t('today_page.template_name')}
                    </label>
                    <input
                        autoFocus
                        type="text"
                        placeholder="ej: Push A, Piernas, Full Body..."
                        value={name}
                        onChange={e => setName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSave()}
                        className={input.base}
                    />
                </div>

                {/* Lista de ejercicios que se guardarán */}
                <div className="mb-5">
                    <label className="text-xs text-zinc-500 font-medium mb-1.5 block">
                        {t('today_page.onsave_exercises')} ({validExercises.length})
                    </label>
                    <div className="bg-surface-2 rounded-xl border border-surface-border divide-y divide-surface-border max-h-48 overflow-y-auto">
                        {validExercises.map(ex => (
                            <div key={ex.id} className="flex items-center gap-2 px-3 py-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-brand-500 flex-shrink-0" />
                                <span className="text-sm text-zinc-300 flex-1 truncate">{ex.name}</span>
                                {ex.muscle_group && (
                                    <span className="text-[10px] text-zinc-600 flex-shrink-0">
                                        {ex.muscle_group}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                    <p className="text-[10px] text-zinc-700 mt-1.5">
                        {t('today_page.tip')}
                    </p>
                </div>

                {error && (
                    <p className="text-red-400 text-sm bg-red-500/10 rounded-lg px-3 py-2 mb-4">
                        {error}
                    </p>
                )}

                {/* Botones */}
                <div className="flex gap-3">
                    <button onClick={onClose} className={btn.ghost + ' flex-1'}>
                        {t('today_page.cancel')}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !name.trim()}
                        className={btn.primary + ' flex-1 flex items-center justify-center gap-2 disabled:opacity-40'}
                    >
                        <Check className="w-4 h-4" />
                        {saving ? 'Guardando...' : 'Guardar plantilla'}
                    </button>
                </div>
            </div>
        </div>
    )
}