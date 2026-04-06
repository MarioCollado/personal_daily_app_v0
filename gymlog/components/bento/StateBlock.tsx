'use client'
import { Zap, Brain, Flame } from 'lucide-react'
import { clsx } from 'clsx'

interface Props {
  energy: number | null
  stress: number | null
  motivation: number | null
  onChange: (field: 'energy' | 'stress' | 'motivation', value: number) => void
  saving?: boolean
}

const METRICS = [
  { key: 'energy' as const, label: 'Energía', Icon: Zap, color: '#f59e0b' },
  { key: 'stress' as const, label: 'Estrés', Icon: Brain, color: '#ef4444' },
  { key: 'motivation' as const, label: 'Motivación', Icon: Flame, color: '#4a5cffff' },
]

function DotRow({ value, max = 5, color, onClick }: { value: number | null; max?: number; color: string; onClick: (v: number) => void }) {
  return (
    <div className="flex gap-1.5 items-center">
      {Array.from({ length: max }, (_, i) => i + 1).map(i => (
        <button
          key={i}
          onClick={() => onClick(i)}
          className={clsx(
            'w-6 h-6 rounded-md transition-all duration-100 active:scale-90 touch-manipulation',
            value !== null && i <= value ? 'opacity-100' : 'opacity-20 hover:opacity-50'
          )}
          style={{ backgroundColor: value !== null && i <= value ? color : '#3f3f46' }}
        />
      ))}
    </div>
  )
}

export default function StateBlock({ energy, stress, motivation, onChange, saving }: Props) {
  return (
    <div className="bento-card flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-widest">Estado</span>
        {saving && <span className="text-[10px] text-zinc-600 animate-pulse-dot">guardando</span>}
      </div>

      <div className="flex flex-col gap-3 flex-1 justify-around">
        {METRICS.map(({ key, label, Icon, color }) => {
          const val = key === 'energy' ? energy : key === 'stress' ? stress : motivation
          return (
            <div key={key} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 w-24 flex-shrink-0">
                <Icon className="w-3 h-3 flex-shrink-0" style={{ color }} />
                <span className="text-[11px] text-zinc-500">{label}</span>
              </div>
              <DotRow value={val} color={color} onClick={v => onChange(key, v)} />
              <span className="text-xs font-mono text-zinc-700 w-4 text-right">{val ?? '—'}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
