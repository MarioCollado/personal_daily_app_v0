'use client'

import { Plus } from 'lucide-react'

interface Props {
  weight: string
  reps: string
  rir: string
  onWeightChange: (value: string) => void
  onRepsChange: (value: string) => void
  onRirChange: (value: string) => void
  onSubmit: () => void
  onReset: () => void
  adding: boolean
  loadingPrevious: boolean
  suggestionSummary?: string
  weightPlaceholder: string
  repsPlaceholder: string
  rirPlaceholder: string
}

export default function StrengthSetComposer({
  weight,
  reps,
  rir,
  onWeightChange,
  onRepsChange,
  onRirChange,
  onSubmit,
  onReset,
  adding,
  loadingPrevious,
  suggestionSummary,
  weightPlaceholder,
  repsPlaceholder,
  rirPlaceholder,
}: Props) {
  return (
    <div className="space-y-2.5">
      {(loadingPrevious || suggestionSummary) && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-surface-border bg-surface-2/75 px-3 py-2">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-main">
              {loadingPrevious ? 'Buscando tu ultima sesion...' : 'Basado en tu ultima sesion'}
            </p>
            {!loadingPrevious && suggestionSummary && (
              <p className="text-[11px] text-muted truncate">{suggestionSummary}</p>
            )}
          </div>
          {!loadingPrevious && suggestionSummary && (
            <button
              type="button"
              onClick={onReset}
              className="text-[11px] font-semibold text-muted hover:text-main transition-colors"
            >
              Restablecer
            </button>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          placeholder={weightPlaceholder}
          value={weight}
          onChange={e => onWeightChange(e.target.value)}
          className="h-11 w-full rounded-xl bg-surface-2 text-main text-center text-base font-mono px-3 border border-surface-border focus:border-brand-500 outline-none transition-colors"
        />

        <span className="text-muted font-bold flex-shrink-0">x</span>

        <input
          type="number"
          inputMode="numeric"
          placeholder={repsPlaceholder}
          value={reps}
          onChange={e => onRepsChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onSubmit()}
          className="h-11 w-full rounded-xl bg-surface-2 text-main text-center text-base font-mono px-3 border border-surface-border focus:border-brand-500 outline-none transition-colors"
        />

        <input
          type="number"
          inputMode="numeric"
          placeholder={rirPlaceholder}
          value={rir}
          onChange={e => onRirChange(e.target.value)}
          className="h-11 w-16 rounded-xl bg-surface-2 text-main text-center text-sm px-2 flex-shrink-0 border border-surface-border focus:border-brand-500 outline-none transition-colors"
        />

        <button
          onClick={onSubmit}
          disabled={adding || !reps || !weight}
          className="h-11 px-3 rounded-xl bg-brand-500 text-brand-foreground flex items-center justify-center disabled:opacity-40 hover:bg-brand-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
