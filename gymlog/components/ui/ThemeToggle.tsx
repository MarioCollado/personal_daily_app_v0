'use client'
import React from 'react'
import { Sun, Sparkles, ZapOff } from 'lucide-react'
import { useTheme } from '@/components/providers/ThemeProvider'
import { clsx } from 'clsx'
import { ThemePeriod } from '@/styles/themes'
import { useI18n } from '@/contexts/I18nContext'

const THEME_ICONS: Record<ThemePeriod, React.ReactNode> = {
  morning: <Sun className="w-4 h-4 text-emerald-400" />,
  midday: <Sun className="w-4 h-4 text-amber-400" />,
  afternoon: <Sun className="w-4 h-4 text-orange-400" />,
  night: <Sparkles className="w-4 h-4 text-amber-500" />,
  sober: <ZapOff className="w-4 h-4 text-muted" />,
}

export function ThemeToggle() {
  const { theme, isSober, toggleSober } = useTheme()
  const { t } = useI18n()

  const labels: Record<ThemePeriod, string> = {
    morning: t('dashboard.themes.morning'),
    midday: t('dashboard.themes.midday'),
    afternoon: t('dashboard.themes.afternoon'),
    night: t('dashboard.themes.night'),
    sober: t('dashboard.themes.sober'),
  }

  return (
    <button
      onClick={toggleSober}
      className={clsx(
        'flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300',
        isSober 
          ? 'bg-surface-2 border-surface-border text-muted' 
          : 'bg-brand/10 border-brand/20 text-brand'
      )}
      title={isSober ? t('dashboard.themes.auto_mode') : t('dashboard.themes.sober_mode')}
    >
      <div className="flex items-center justify-center">
        {THEME_ICONS[theme]}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:block">
        {isSober ? t('dashboard.themes.sober') : labels[theme]}
      </span>
      
      <div className="flex items-center gap-1 ml-1 pl-2 border-l border-current/20">
        <div className={clsx(
          "w-1.5 h-1.5 rounded-full transition-all duration-500",
          isSober ? "bg-muted shadow-[0_0_8px_rgba(113,113,122,0.3)]" : "bg-brand animate-pulse-dot shadow-[0_0_8px_var(--brand)]"
        )} />
      </div>
    </button>
  )
}
