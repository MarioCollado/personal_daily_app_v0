'use client'

import { Plus, LayoutTemplate, Copy, X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  onAddExercise: () => void
  onUseTemplate: () => void
  onDuplicate?: () => void
  duplicateLabel?: string
  duplicating?: boolean
  templatesCount?: number
}

export default function WorkoutQuickActionsSheet({
  open,
  onClose,
  onAddExercise,
  onUseTemplate,
  onDuplicate,
  duplicateLabel,
  duplicating = false,
  templatesCount = 0,
}: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-t-[32px] border border-surface-border bg-surface-1 p-5 shadow-2xl animate-slide-up"
        onClick={event => event.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted">Acciones rapidas</p>
            <p className="mt-1 text-lg font-semibold text-main">Sigue con tu sesion</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-muted hover:text-main hover:bg-surface-2 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          <button
            onClick={onAddExercise}
            className="w-full flex items-center justify-between rounded-2xl border border-surface-border bg-surface-2 px-4 py-4 text-left hover:border-brand-500/30 hover:bg-brand-500/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/12 flex items-center justify-center">
                <Plus className="w-4 h-4 text-brand-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-main">Crear ejercicio</p>
                <p className="text-[11px] text-muted">Anade un ejercicio nuevo a la sesion actual</p>
              </div>
            </div>
          </button>

          <button
            onClick={onUseTemplate}
            className="w-full flex items-center justify-between rounded-2xl border border-surface-border bg-surface-2 px-4 py-4 text-left hover:border-brand-500/30 hover:bg-brand-500/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/12 flex items-center justify-center">
                <LayoutTemplate className="w-4 h-4 text-brand-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-main">Usar plantilla</p>
                <p className="text-[11px] text-muted">
                  {templatesCount > 0 ? `${templatesCount} plantillas disponibles` : 'Carga una rutina guardada'}
                </p>
              </div>
            </div>
          </button>

          {onDuplicate && duplicateLabel && (
            <button
              onClick={onDuplicate}
              disabled={duplicating}
              className="w-full flex items-center justify-between rounded-2xl border border-surface-border bg-surface-2 px-4 py-4 text-left hover:border-brand-500/30 hover:bg-brand-500/5 transition-colors disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-500/12 flex items-center justify-center">
                  <Copy className="w-4 h-4 text-brand-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-main">{duplicating ? 'Duplicando...' : duplicateLabel}</p>
                  <p className="text-[11px] text-muted">Reutiliza tu estructura anterior en un toque</p>
                </div>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
