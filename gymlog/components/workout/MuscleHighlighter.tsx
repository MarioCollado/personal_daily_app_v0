'use client'

import { useMemo, useState } from 'react'
import Body, { type ExtendedBodyPart } from '@mjcdev/react-body-highlighter'
import { clsx } from 'clsx'
import type { Exercise } from '@/types'
import { buildMuscleActivation, getBodyHighlighterData, getMuscleLevelLabel } from '@/lib/workout-insights'

type Variant = 'default' | 'compact' | 'background'

interface Props {
  exercises: Exercise[]
  className?: string
  variant?: Variant
  gender?: 'male' | 'female'
  showLegend?: boolean
  showHint?: boolean
}

const COLORS = ['#3dcf8e', '#facc15', '#ef4444'] as const

export default function MuscleHighlighter({
  exercises,
  className,
  variant = 'default',
  gender = 'male',
  showLegend = true,
  showHint = true,
}: Props) {
  const activations = useMemo(() => buildMuscleActivation(exercises), [exercises])
  const bodyData = useMemo(() => getBodyHighlighterData(exercises), [exercises])
  const [selected, setSelected] = useState<ExtendedBodyPart | null>(null)

  const selectedActivation = activations.find(item => item.slug === selected?.slug) || activations[0] || null
  const dual = variant !== 'compact'

  return (
    <div
      className={clsx(
        'relative rounded-[28px] border border-surface-border bg-surface-1/85 shadow-sm backdrop-blur-sm',
        variant === 'background'
          ? 'border-none bg-transparent shadow-none backdrop-blur-0'
          : variant === 'compact'
            ? 'p-3'
            : 'p-4 sm:p-5',
        className
      )}
    >
      {variant !== 'background' && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted">Mapa muscular</p>
            <p className="mt-1 text-sm font-semibold text-main">
              {selectedActivation ? `${selectedActivation.label} - ${getMuscleLevelLabel(selectedActivation.level)}` : 'Sin activacion suficiente'}
            </p>
          </div>
          {showLegend && (
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
              <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-[#3dcf8e]" /> Bajo</span>
              <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-[#facc15]" /> Medio</span>
              <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-[#ef4444]" /> Alto</span>
            </div>
          )}
        </div>
      )}

      <div
        className={clsx(
          'flex items-center justify-center gap-2 sm:gap-4',
          variant === 'background' ? 'scale-[1.16] opacity-100' : ''
        )}
      >
        <div className={clsx('transition-transform duration-300', selectedActivation && 'scale-[1.01]')}>
          <Body
            data={bodyData}
            gender={gender}
            side="front"
            scale={variant === 'compact' ? 0.78 : variant === 'background' ? 1.28 : 1}
            border={variant === 'background' ? '#4b5563' : '#3a3a42'}
            colors={COLORS}
            onBodyPartClick={bodyPart => setSelected(bodyPart)}
          />
        </div>

        {dual && (
          <div className={clsx('transition-transform duration-300', selectedActivation && 'scale-[1.01]')}>
            <Body
              data={bodyData}
              gender={gender}
              side="back"
              scale={variant === 'background' ? 1.28 : 1}
              border={variant === 'background' ? '#4b5563' : '#3a3a42'}
              colors={COLORS}
              onBodyPartClick={bodyPart => setSelected(bodyPart)}
            />
          </div>
        )}
      </div>

      {variant !== 'background' && selectedActivation && (
        <div className="mt-4 rounded-2xl border border-surface-border bg-surface-2/80 px-3 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-main">{selectedActivation.label}</p>
              <p className="mt-0.5 text-[11px] text-muted">Nivel {getMuscleLevelLabel(selectedActivation.level)}</p>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3].map(level => (
                <span
                  key={level}
                  className={clsx(
                    'h-2.5 w-6 rounded-full transition-opacity',
                    level === 1 && 'bg-[#3dcf8e]',
                    level === 2 && 'bg-[#facc15]',
                    level === 3 && 'bg-[#ef4444]',
                    level > selectedActivation.intensity && 'opacity-20'
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {variant !== 'background' && !selectedActivation && showHint && (
        <p className="mt-3 text-[11px] text-muted">Anade ejercicios o series para resaltar zonas activas.</p>
      )}
    </div>
  )
}
