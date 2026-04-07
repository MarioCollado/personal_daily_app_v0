'use client'
import React from 'react'
import { Sun, Moon, Sparkles, ZapOff } from 'lucide-react'
import { useTheme } from '@/components/providers/ThemeProvider'
import { clsx } from 'clsx'
import { ThemePeriod } from '@/styles/themes'

const THEME_ICONS: Record<ThemePeriod, React.ReactNode> = {
  morning: <Sun className="w-4 h-4 text-emerald-400" />,
  midday: <Sun className="w-4 h-4 text-amber-400" />,
  afternoon: <Sun className="w-4 h-4 text-orange-400" />,
  night: <Sparkles className="w-4 h-4 text-amber-500" />,
  sober: <ZapOff className="w-4 h-4 text-zinc-500" />,
}

const THEME_LABELS: Record<ThemePeriod, string> = {
  morning: 'Mañana',
  midday: 'Mediodía',
  afternoon: 'Tarde',
  night: 'Noche Premium',
  sober: 'Sobrio',
}

export function ThemeToggle() {
  const { theme, isSober, toggleSober } = useTheme()

  return (
    <button
      onClick={toggleSober}
      className={clsx(
        'flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300',
        isSober 
          ? 'bg-surface-2 border-surface-border text-muted' 
          : 'bg-brand/10 border-brand/20 text-brand'
      )}
      title={isSober ? 'Cambiar a modo Automático' : 'Cambiar a modo Sobrio'}
    >
      <div className="flex items-center justify-center">
        {THEME_ICONS[theme]}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:block">
        {isSober ? 'Sobrio' : THEME_LABELS[theme]}
      </span>
      
      <div className="flex items-center gap-1 ml-1 pl-2 border-l border-current/10">
        <div className={clsx(
          "w-1.5 h-1.5 rounded-full transition-all duration-500",
          isSober ? "bg-zinc-600" : "bg-brand animate-pulse-dot"
        )} />
      </div>
    </button>
  )
}
