'use client'
import { Zap, Brain, Flame, Smartphone } from 'lucide-react'
import { clsx } from 'clsx'
import { card } from '@/styles/components'
import { useI18n } from '@/contexts/I18nContext'

interface Props {
  energy: number | null
  stress: number | null
  motivation: number | null
  phoneUsage: number | null
  onChange: (field: 'energy' | 'stress' | 'motivation' | 'phone_usage', value: number) => void
  saving?: boolean
}

function DotRow({
  value, color, onClick, max = 5,
}: {
  value: number | null
  color: string
  onClick: (v: number) => void
  max?: number
}) {
  return (
    <div className="flex gap-1 sm:gap-1.5 lg:gap-2 items-center flex-1 min-w-0 overflow-hidden">
      {Array.from({ length: max }, (_, i) => i + 1).map(i => (
        <button
          key={i}
          onClick={() => onClick(i)}
          className={clsx(
            'flex-1 h-5 sm:h-6 lg:h-7 flex-shrink-0 rounded-[4px] sm:rounded-md lg:rounded-lg',
            'transition-all duration-100 active:scale-90',
            value !== null && i <= value ? 'opacity-100 shadow-sm' : 'bg-surface-3 opacity-30 hover:opacity-50'
          )}
          style={{ backgroundColor: value !== null && i <= value ? color : undefined }}
        />
      ))}
    </div>
  )
}

export default function StateBlock({ energy, stress, motivation, phoneUsage, onChange, saving }: Props) {
  const { t } = useI18n()
  
  const METRICS = [
    { key: 'energy' as const, label: t('dashboard.state_block.metrics.energy'), Icon: Zap, color: '#f59e0b' },
    { key: 'stress' as const, label: t('dashboard.state_block.metrics.stress'), Icon: Brain, color: '#ef4444' },
    { key: 'motivation' as const, label: t('dashboard.state_block.metrics.motivation'), Icon: Flame, color: '#22c55e' },
    { key: 'phone_usage' as const, label: t('dashboard.state_block.metrics.phone_usage'), Icon: Smartphone, color: '#ef4444' },
  ]

  const values: Record<string, number | null> = {
    energy, stress, motivation, phone_usage: phoneUsage,
  }

  return (
    <div className={card.bento + ' flex flex-col h-full'}>

      <div className="relative flex items-center justify-center mb-2 lg:mb-3 min-h-[20px]">
        <div className="flex items-center gap-1.5">
          <Brain className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-purple-400" />
          <span className="text-[11px] lg:text-xs font-bold text-muted uppercase tracking-widest">
            {t('dashboard.state_block.title')}
          </span>
        </div>

        {saving && (
          <span className="absolute right-0 text-[10px] text-muted animate-pulse-dot">
            {t('dashboard.state_block.saving')}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2.5 lg:gap-3 flex-1 justify-around">
        {METRICS.map(({ key, label, Icon, color }) => {
          const val = values[key]

          return (
            <div key={key} className="flex items-center gap-2 lg:gap-3 min-w-0">

              <div className="flex items-center gap-1.5 w-20 sm:w-24 lg:w-28 flex-shrink-0">
                <Icon className="w-3 h-3 lg:w-3.5 lg:h-3.5 flex-shrink-0" style={{ color }} />
                <span className="text-[11px] sm:text-xs lg:text-sm text-muted font-medium truncate">
                  {label}
                </span>
              </div>

              <DotRow value={val} color={color} max={5} onClick={v => onChange(key, v)} />

              <span className="text-xs lg:text-sm font-mono text-muted w-4 text-right flex-shrink-0">
                {val ?? '—'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}