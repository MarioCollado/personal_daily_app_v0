'use client'
import { Zap, Brain, Flame, Smartphone } from 'lucide-react'
import { clsx } from 'clsx'
import { card, text } from '@/styles/components'

interface Props {
  energy: number | null
  stress: number | null
  motivation: number | null
  freeTime: number | null
  onChange: (field: 'energy' | 'stress' | 'motivation' | 'free_time', value: number) => void
  saving?: boolean
}

const METRICS = [
  { key: 'energy' as const, label: 'Energía', Icon: Zap, color: '#f59e0b' },
  { key: 'stress' as const, label: 'Estrés', Icon: Brain, color: '#ef4444' },
  { key: 'motivation' as const, label: 'Motivación', Icon: Flame, color: '#22c55e' },
  { key: 'free_time' as const, label: 'Móvil', Icon: Smartphone, color: '#ef4444' },
]

function DotRow({
  value, color, onClick, max = 5,
}: {
  value: number | null
  color: string
  onClick: (v: number) => void
  max?: number
}) {
  return (
    <div className="flex gap-1 sm:gap-1.5 items-center flex-1 min-w-0 overflow-hidden">
      {Array.from({ length: max }, (_, i) => i + 1).map(i => (
        <button
          key={i}
          onClick={() => onClick(i)}
          className={clsx(
            'flex-1 h-5 sm:h-6 flex-shrink-0 rounded-[4px] sm:rounded-md',
            'transition-all duration-100 active:scale-90',
            value !== null && i <= value ? 'opacity-100' : 'opacity-20 hover:opacity-50'
          )}
          style={{ backgroundColor: value !== null && i <= value ? color : '#3f3f46' }}
        />
      ))}
    </div>
  )
}

export default function StateBlock({ energy, stress, motivation, freeTime, onChange, saving }: Props) {
  const values: Record<string, number | null> = {
    energy, stress, motivation, free_time: freeTime,
  }

  return (
    <div className={card.bento + ' flex flex-col h-full p-4'}>

      <div className="relative flex items-center justify-center mb-2 min-h-[20px]">
        <div className="flex items-center gap-1.5">
          <Brain className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-widest">
            Estado
          </span>
        </div>

        {saving && (
          <span className="absolute right-0 text-[10px] text-zinc-600 animate-pulse-dot">
            guardando
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2.5 flex-1 justify-around">
        {METRICS.map(({ key, label, Icon, color }) => {
          const val = values[key]

          return (
            <div key={key} className="flex items-center gap-2 min-w-0">

              <div className="flex items-center gap-1.5 w-20 sm:w-24 flex-shrink-0">
                <Icon className="w-3 h-3 flex-shrink-0" style={{ color }} />
                <span className="text-[11px] sm:text-xs text-zinc-500 truncate">
                  {label}
                </span>
              </div>

              <DotRow value={val} color={color} max={5} onClick={v => onChange(key, v)} />

              <span className="text-xs font-mono text-zinc-600 w-4 text-right flex-shrink-0">
                {val ?? '—'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}