'use client'
import { useState } from 'react'
import { X, Dumbbell, Trash2, ChevronRight, LayoutTemplate } from 'lucide-react'
import { clsx } from 'clsx'
import { deleteTemplate } from '@/lib/db'
import { card, btn } from '@/styles/components'
import type { WorkoutTemplate } from '@/types'

interface Props {
    templates: WorkoutTemplate[]
    onSelect: (template: WorkoutTemplate) => void
    onDeleted: (templateId: string) => void
    onClose: () => void
}

export default function TemplatePickerModal({ templates, onSelect, onDeleted, onClose }: Props) {
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
    const [deleting, setDeleting] = useState<string | null>(null)

    async function handleDelete(templateId: string) {
        if (confirmDelete !== templateId) {
            setConfirmDelete(templateId)
            return
        }
        setDeleting(templateId)
        try {
            await deleteTemplate(templateId)
            onDeleted(templateId)
            setConfirmDelete(null)
        } finally {
            setDeleting(null)
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
                        <h3 className="font-semibold text-lg">Plantillas</h3>
                    </div>
                    <button onClick={onClose} className={btn.icon}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Lista */}
                {templates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-surface-2 flex items-center justify-center">
                            <LayoutTemplate className="w-6 h-6 text-zinc-600" />
                        </div>
                        <p className="text-zinc-500 text-sm">Aún no tienes plantillas.</p>
                        <p className="text-zinc-600 text-xs">
                            Finaliza un entreno y guárdalo como plantilla.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                        {templates.map(t => (
                            <div
                                key={t.id}
                                className={clsx(
                                    'flex items-center gap-3 p-3 rounded-xl border transition-colors',
                                    confirmDelete === t.id
                                        ? 'border-red-500/30 bg-red-500/5'
                                        : 'border-surface-border bg-surface-2 hover:border-brand-500/30 hover:bg-brand-500/5'
                                )}
                            >
                                {/* Icono */}
                                <div className="w-9 h-9 rounded-lg bg-surface-3 flex items-center justify-center flex-shrink-0">
                                    <Dumbbell className="w-4 h-4 text-zinc-500" />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-sm truncate">{t.name}</div>
                                    <div className="text-zinc-600 text-xs mt-0.5">
                                        {t.exercises?.length || 0} ejercicios
                                        {t.exercises && t.exercises.length > 0 && (
                                            <span className="ml-1 text-zinc-700">
                                                · {t.exercises.slice(0, 2).map(e => e.name).join(', ')}
                                                {t.exercises.length > 2 && ` +${t.exercises.length - 2}`}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Acciones */}
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <button
                                        onClick={() => handleDelete(t.id)}
                                        disabled={deleting === t.id}
                                        className={clsx(
                                            'p-2 rounded-lg transition-colors text-xs',
                                            confirmDelete === t.id
                                                ? 'bg-red-500/20 text-red-400'
                                                : 'text-zinc-600 hover:text-red-400 hover:bg-red-500/10'
                                        )}
                                    >
                                        {confirmDelete === t.id
                                            ? <span className="text-[10px] font-medium px-1">Confirmar</span>
                                            : <Trash2 className="w-3.5 h-3.5" />
                                        }
                                    </button>

                                    <button
                                        onClick={() => onSelect(t)}
                                        className="p-2 rounded-lg text-brand-400 hover:bg-brand-500/10 transition-colors"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Footer info */}
                {templates.length > 0 && templates.length < 6 && (
                    <p className="text-center text-[11px] text-zinc-700 mt-4">
                        {6 - templates.length} plantilla{6 - templates.length !== 1 ? 's' : ''} disponible{6 - templates.length !== 1 ? 's' : ''}
                    </p>
                )}
                {templates.length >= 6 && (
                    <p className="text-center text-[11px] text-zinc-700 mt-4">
                        Has alcanzado el límite de 6 plantillas
                    </p>
                )}
            </div>
        </div>
    )
}